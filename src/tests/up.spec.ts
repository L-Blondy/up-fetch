import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
   afterAll,
   afterEach,
   beforeAll,
   describe,
   expect,
   expectTypeOf,
   test,
} from 'vitest'
import { type FetcherOptions, up } from '..'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

describe('Should receive the upfetch arguments (up to 3)', () => {
   test.each`
      input               | options                 | ctx
      ${baseUrl}          | ${{ method: 'DELETE' }} | ${{ is: 'ctx' }}
      ${new URL(baseUrl)} | ${{ method: 'DELETE' }} | ${'context'}
   `('%#', async ({ input, options, ctx }) => {
      server.use(
         http.delete(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(
         fetch,
         (receivedInput, receivedOptions, receivedCtx) => {
            expectTypeOf(receivedInput).toEqualTypeOf<string | URL>()
            expectTypeOf(receivedOptions).toEqualTypeOf<
               FetcherOptions<typeof fetch, any, any, any>
            >()
            expect(receivedInput).toBe(input)
            expect(receivedOptions).toBe(options)
            expect(receivedCtx).toBe(ctx)
            return {}
         },
      )

      await upfetch(input, options, ctx)
   })
})
