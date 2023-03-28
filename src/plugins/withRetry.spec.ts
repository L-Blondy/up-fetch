import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { withRetry } from './withRetry.js'

describe('withRetry', () => {
   const server = setupServer()
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())

   test('Should not retry by default', async () => {
      let count = 0
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            count++
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )

      await withRetry(fetch)('https://example.com')
      expect(count).toBe(1)
   })

   test('`{retryTimes: 1}` should retry once', async () => {
      let count = 0
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            count++
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await withRetry(fetch)('https://example.com', { retryTimes: 1 })
      expect(count).toBe(2)
   })

   test.each`
      status | retryCount
      ${408} | ${1}
      ${413} | ${1}
      ${429} | ${1}
      ${500} | ${1}
      ${502} | ${1}
      ${503} | ${1}
      ${504} | ${1}
      ${400} | ${0}
   `('By default, should retry for status $status', async ({ status, retryCount }) => {
      let count = -1
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            count++
            return res(ctx.text('hello error'), ctx.status(status))
         }),
      )
      await withRetry(fetch)('https://example.com', { retryTimes: 1, retryDelay: () => 0 })
      expect(count).toBe(retryCount)
   })

   test.each`
      status | retryCount
      ${408} | ${0}
      ${413} | ${0}
      ${429} | ${0}
      ${500} | ${0}
      ${502} | ${0}
      ${503} | ${0}
      ${504} | ${0}
      ${482} | ${1}
   `(
      '`retryWhen` can be used to customize the "when to retry" logic',
      async ({ status, retryCount }) => {
         let count = -1
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               count++
               return res(ctx.text('hello error'), ctx.status(status))
            }),
         )
         await withRetry(fetch)('https://example.com', {
            retryTimes: 1,
            retryDelay: () => 0,
            retryWhen: (res) => res.status === 482,
         })
         expect(count).toBe(retryCount)
      },
   )

   test('the default retry delay should be 2000ms for the first retry 3000ms for the second (attemptNumber * 1.5)', async () => {
      let count = 0
      let startMs = Date.now()
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            if (count === 1) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(2000)
               expect(Date.now() - startMs).toBeLessThanOrEqual(2200)
               startMs = Date.now()
            }
            if (count === 2) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(3000)
               expect(Date.now() - startMs).toBeLessThanOrEqual(3200)
               startMs = Date.now()
            }
            count++
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await withRetry(fetch)('https://example.com', { retryTimes: 2 })
      expect(count).toBe(3)
   }, 10000)

   test('`retryDelay` should receive `attemptNumber` and `response` as arguments', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await withRetry(fetch)('https://example.com', {
         retryTimes: 1,
         retryDelay: (attemptNumber, response) => {
            expect(attemptNumber).toBe(1)
            expect(response.status).toBe(408)
            return 0
         },
      })
   }, 10000)

   test('the default retry delay can be customized with `retryDelay`', async () => {
      let count = 0
      let startMs = Date.now()
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            if (count === 1) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(500)
               expect(Date.now() - startMs).toBeLessThanOrEqual(700)
               startMs = Date.now()
            }
            if (count === 2) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(1000)
               expect(Date.now() - startMs).toBeLessThanOrEqual(1200)
               startMs = Date.now()
            }
            if (count === 3) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(1500)
               expect(Date.now() - startMs).toBeLessThanOrEqual(1700)
               startMs = Date.now()
            }
            count++
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await withRetry(fetch)('https://example.com', {
         retryTimes: 3,
         retryDelay: (attempt) => attempt * 500,
      })
      expect(count).toBe(4)
   }, 10000)
})
