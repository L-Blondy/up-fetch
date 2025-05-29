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
      expectedInput       | expectedOptions         | expectedCtx
      ${baseUrl}          | ${{ method: 'DELETE' }} | ${{ is: 'ctx' }}
      ${new URL(baseUrl)} | ${{ method: 'DELETE' }} | ${'context'}
   `('%#', async ({ expectedInput, expectedOptions, expectedCtx }) => {
      server.use(
         http.delete(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, (input, options, ctx) => {
         expectTypeOf(input).toEqualTypeOf<RequestInfo | URL>()
         expectTypeOf(options).toEqualTypeOf<
            FetcherOptions<typeof fetch, any, any, any>
         >()
         expect(input).toBe(expectedInput)
         expect(options).toBe(expectedOptions)
         expect(ctx).toBe(expectedCtx)
         return {}
      })

      await upfetch(expectedInput, expectedOptions, expectedCtx)
   })
})
