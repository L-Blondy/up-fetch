import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { nanioFactory } from './nanioFactory'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { isResponseError, ResponseError } from './ResponseError'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('fetch response error should be parsed to an instanceof ResponseError and should remain instanceof ResponseError in "onError"', async () => {
   server.use(
      rest.get('https://example.com', (req, res, ctx) => {
         return res(ctx.json({ some: 'error' }), ctx.status(400))
      }),
   )

   const nanio = nanioFactory.create(() => ({
      baseUrl: 'https://example.com',
      onError(error) {
         expect(error instanceof ResponseError).toBeTruthy()
      },
   }))
   await nanio().catch((error) => {
      expect(error instanceof ResponseError).toBeTruthy()
   })
})

test('When receiving a ResponseError, "isResponseError(error)" should be true', async () => {
   server.use(
      rest.get('https://example.com', (req, res, ctx) => {
         return res(ctx.json({ some: 'error' }), ctx.status(400))
      }),
   )

   const nanio = nanioFactory.create(() => ({
      baseUrl: 'https://example.com',
      onError(error) {
         expect(isResponseError(error)).toBe(true)
      },
   }))
   await nanio().catch((error) => {
      expect(isResponseError(error)).toBe(true)
   })
})
