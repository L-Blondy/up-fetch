import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { createFetcher } from './createFetcher.js'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { isResponseError } from './ResponseError.js'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('fetch response error should trigger a ResponseError', async () => {
   server.use(
      rest.get('https://example.com', (req, res, ctx) => {
         return res(ctx.json({ some: 'error' }), ctx.status(400))
      }),
   )

   const upfetch = createFetcher(() => ({
      baseUrl: 'https://example.com',
      onError(error) {
         expect(isResponseError(error)).toBeTruthy()
      },
   }))
   await upfetch().catch((error) => {
      expect(isResponseError(error)).toBeTruthy()
   })
})

test('When receiving a ResponseError, "isResponseError(error)" should be true', async () => {
   server.use(
      rest.get('https://example.com', (req, res, ctx) => {
         return res(ctx.json({ some: 'error' }), ctx.status(400))
      }),
   )

   const upfetch = createFetcher(() => ({
      baseUrl: 'https://example.com',
      onError(error) {
         expect(isResponseError(error)).toBe(true)
      },
   }))
   await upfetch().catch((error) => {
      expect(isResponseError(error)).toBe(true)
   })
})
