import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from '..'
import { bodyMock } from './_mocks'

const baseUrl = 'https://example.com'
const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('headers', () => {
   describe('should automatically set content-type to application/json for jsonifiable bodies that serialize to strings', () => {
      test.each`
         body                            | expected
         ${{}}                           | ${true}
         ${{ a: 1 }}                     | ${true}
         ${[1, 2]}                       | ${true}
         ${bodyMock.classJsonifiable}    | ${true}
         ${bodyMock.classNonJsonifiable} | ${false}
         ${bodyMock.buffer}              | ${false}
         ${bodyMock.dataview}            | ${false}
         ${bodyMock.blob}                | ${false}
         ${bodyMock.typedArray}          | ${false}
         ${bodyMock.formData}            | ${false}
         ${bodyMock.urlSearchParams}     | ${false}
         ${bodyMock.getStream()}         | ${false}
         ${''}                           | ${false}
         ${0}                            | ${false}
         ${undefined}                    | ${false}
         ${null}                         | ${false}
      `('%#', async ({ body, expected }) => {
         server.use(
            http.post(baseUrl, async ({ request }) => {
               const hasApplicationJsonHeader =
                  request.headers.get('content-type') === 'application/json'
               expect(hasApplicationJsonHeader).toEqual(expected)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: baseUrl,
            method: 'POST',
            serializeBody: (body) => JSON.stringify(body),
         }))
         await upfetch('', {
            body,
            // @ts-ignore the global fetch type does not include "duplex"
            duplex: body?.getReader ? 'half' : undefined,
         })
      })
   })

   test('should not set content-type to application/json when body is jsonifiable but serializes to non-string', async () => {
      server.use(
         http.post(baseUrl, async ({ request }) => {
            expect(
               request.headers
                  .get('content-type')
                  ?.includes('application/json'),
            ).toEqual(false)
            expect(
               request.headers
                  .get('content-type')
                  ?.includes('multipart/form-data'),
            ).toEqual(true)
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         method: 'POST',
         serializeBody: () => new FormData(),
      }))
      await upfetch('', { body: { a: 1 } })
   })

   describe('should respect existing content-type header when already set', () => {
      test.each`
         body
         ${{}}
         ${{ a: 1 }}
         ${[1, 2]}
         ${bodyMock.classJsonifiable}
      `('%#', async ({ body }) => {
         server.use(
            http.post(baseUrl, async ({ request }) => {
               expect(request.headers.get('content-type')).toEqual('html/text')
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: baseUrl,
            headers: { 'content-type': 'html/text' },
            method: 'POST',
         }))
         await upfetch('', { body })
      })
   })

   describe('should merge up.headers and upfetch.headers', () => {
      test.each`
         upHeaders                  | upfetchHeaders             | finalHeaders
         ${{ a: '2' }}              | ${{}}                      | ${{ a: '2' }}
         ${new Headers({ a: '2' })} | ${{}}                      | ${{ a: '2' }}
         ${{ a: '2' }}              | ${{ a: '3' }}              | ${{ a: '3' }}
         ${{ a: '2' }}              | ${new Headers({ a: '3' })} | ${{ a: '3' }}
      `('%#', async ({ upHeaders, upfetchHeaders, finalHeaders }) => {
         server.use(
            http.post(baseUrl, async ({ request }) => {
               expect(
                  Object.fromEntries([...request.headers.entries()]),
               ).toEqual(finalHeaders)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            headers: upHeaders,
         }))
         await upfetch(baseUrl, {
            headers: upfetchHeaders,
            method: 'POST',
         })
      })
   })

   test('should support removing an up.headers[key] by setting upfetch.headers[key] to undefined', async () => {
      server.use(
         http.post(baseUrl, async ({ request }) => {
            expect(request.headers.get('content-type')).toEqual(null)
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         headers: { 'content-type': 'text/html' },
         method: 'POST',
      }))
      await upfetch('', { headers: { 'content-type': undefined } })
   })
})
