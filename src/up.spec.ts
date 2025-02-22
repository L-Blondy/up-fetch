/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import {
   afterAll,
   afterEach,
   beforeAll,
   describe,
   expect,
   expectTypeOf,
   test,
   vi,
} from 'vitest'
import { up } from './up'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { isResponseError, ResponseError } from './response-error'
import { bodyMock } from './_mocks'
import { fallbackOptions } from './fallback-options'
import { object, pipe, string, transform } from 'valibot'
import { scheduler } from 'timers/promises'
import { z } from 'zod'
import { isValidationError, ValidationError } from './validation-error'
import type { FetcherOptions } from './types'

describe('up', () => {
   let server = setupServer()
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())

   test('Should receive the fetcher arguments', async () => {
      up(fetch, (input, options) => {
         expectTypeOf(input).toEqualTypeOf<string | Request | URL>()
         expectTypeOf(options).toEqualTypeOf<
            FetcherOptions<typeof fetch, any, any, any>
         >()
         return {}
      })
   })

   describe('throwResponseError', () => {
      test('should throw ResponseError by default when response.ok is false', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let catchCount = 0

         let upfetch = up(fetch, (input) => ({
            baseUrl: 'https://example.com',
         }))

         await upfetch('').catch((error) => {
            expect(isResponseError(error)).toEqual(true)
            catchCount++
         })
         expect(catchCount).toEqual(1)
      })

      test('should not throw when throwResponseError returns false', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let catchCount = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            throwResponseError: () => false,
         }))

         await upfetch('').catch(() => {
            catchCount++
         })
         expect(catchCount).toEqual(0)
      })

      test('should execute throwResponseError before up.parseResponseError', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let catchCount = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            throwResponseError: () => {
               expect(catchCount).toBe(0)
               catchCount++
               return true
            },
            parseResponseError: async (e) => {
               expect(catchCount).toBe(1)
               catchCount++
               return e
            },
         }))

         await upfetch('').catch(() => {
            expect(catchCount).toBe(2)
            catchCount++
         })
         expect(catchCount).toEqual(3)
      })

      test('should execute throwResponseError before upfetch.parseResponseError', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let catchCount = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            throwResponseError: () => {
               expect(catchCount).toBe(0)
               catchCount++
               return true
            },
         }))

         await upfetch('', {
            parseResponseError: async (e) => {
               expect(catchCount).toBe(1)
               catchCount++
               return e
            },
         }).catch(() => {
            expect(catchCount).toBe(2)
            catchCount++
         })
         expect(catchCount).toEqual(3)
      })

      test('should support asynchronous throwResponseError functions', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let catchCount = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            throwResponseError: async () => {
               return new Promise((resolve) => {
                  catchCount++
                  setTimeout(() => resolve(true), 100)
               })
            },
         }))

         await upfetch('', {
            parseResponseError: async (e) => {
               expect(catchCount).toBe(1)
               catchCount++
               return e
            },
         }).catch(() => {
            expect(catchCount).toBe(2)
            catchCount++
         })
         expect(catchCount).toEqual(3)
      })
   })

   describe('body', () => {
      test('should ignore up.body configuration', async () => {
         server.use(
            http.post('https://example.com', async ({ request }) => {
               let body = await request.text()
               if (count === 1) {
                  expect(body).toBe('')
               }
               if (count === 2) {
                  expect(body).toBe('my body')
               }
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            method: 'POST',
            body: 'my body',
         }))
         await upfetch('')
         count++
         await upfetch('', { body: 'my body' })
      })
   })

   describe('headers', () => {
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
      `(
         'should automatically set content-type to application/json for jsonifiable bodies that serialize to strings',
         async ({ body, expected }) => {
            server.use(
               http.post('https://example.com', async ({ request }) => {
                  let hasApplicationJsonHeader =
                     request.headers.get('content-type') === 'application/json'
                  expect(hasApplicationJsonHeader).toEqual(expected)
                  return HttpResponse.json({ hello: 'world' }, { status: 200 })
               }),
            )

            let upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
               method: 'POST',
               serializeBody: (body) => JSON.stringify(body),
            }))
            await upfetch('', {
               body,
               // @ts-ignore the global fetch type does not include "duplex"
               duplex: body?.getReader ? 'half' : undefined,
            })
         },
      )

      test.each`
         body                         | expected
         ${{}}                        | ${false}
         ${{ a: 1 }}                  | ${false}
         ${[1, 2]}                    | ${false}
         ${bodyMock.classJsonifiable} | ${false}
      `(
         'should not set content-type to application/json when body is jsonifiable but serializes to non-string',
         async ({ body, expected }) => {
            server.use(
               http.post('https://example.com', async ({ request }) => {
                  let hasApplicationJsonHeader =
                     request.headers.get('content-type') === 'application/json'
                  expect(hasApplicationJsonHeader).toEqual(expected)
                  return HttpResponse.json({ hello: 'world' }, { status: 200 })
               }),
            )

            let upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
               method: 'POST',
               serializeBody: () => new FormData(),
            }))
            await upfetch('', {
               body,
               // @ts-ignore the global fetch type does not include "duplex"
               duplex: body?.getReader ? 'half' : undefined,
            })
         },
      )

      test.each`
         body
         ${{}}
         ${{ a: 1 }}
         ${[1, 2]}
         ${bodyMock.classJsonifiable}
      `(
         'should respect existing content-type header when already set',
         async ({ body }) => {
            server.use(
               http.post('https://example.com', async ({ request }) => {
                  expect(request.headers.get('content-type')).toEqual(
                     'html/text',
                  )
                  return HttpResponse.json({ hello: 'world' }, { status: 200 })
               }),
            )

            let upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
               headers: { 'content-type': 'html/text' },
               method: 'POST',
            }))
            await upfetch('', { body })
         },
      )

      test('should allow upfetch.headers to override up.headers', async () => {
         server.use(
            http.post('https://example.com', async ({ request }) => {
               expect(request.headers.get('content-type')).toEqual(
                  'from upfetch',
               )
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            headers: { 'content-type': 'from up' },
            method: 'POST',
         }))
         await upfetch('', { headers: { 'content-type': 'from upfetch' } })
      })

      test('should support removing up headers by setting `undefined` in upfetch headers', async () => {
         server.use(
            http.post('https://example.com', async ({ request }) => {
               expect(request.headers.get('content-type')).toEqual(null)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            headers: { 'content-type': 'text/html' },
            method: 'POST',
         }))
         await upfetch('', { headers: { 'content-type': undefined } })
      })
   })

   describe('params', () => {
      test('should prioritize input URL params over up.params', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               expect(new URL(request.url).search).toEqual('?hello=people')
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            params: { hello: 'world' },
         }))

         await upfetch('/?hello=people')
      })

      test('should merge up.params and upfetch.params with input URL params (input URL params are not deduped)', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               expect(new URL(request.url).search).toEqual(
                  '?input=param&hello=people&input=test',
               )
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

         await upfetch('/?input=param', {
            params: { hello: 'people', input: 'test' },
         })
      })

      test('should support removing up params by setting `undefined` in upfetch params', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               expect(new URL(request.url).search).toEqual('?hello=world')
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            params: { hello: 'world', input: 'test' },
         }))

         await upfetch('/', {
            params: { input: undefined },
         })
      })
   })

   describe('serializeParams', () => {
      test('should receive the params object for serialization', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeParams(params) {
               expect(params).toEqual({ a: 1 })
               return ''
            },
         }))
         await upfetch('', { params: { a: 1 } })
      })

      test('URL-defined params should not be passed to the serialization process', async () => {
         server.use(
            http.get('https://example.com/path', ({ request }) => {
               expect(new URL(request.url).search).toEqual('?b=2&a=1')

               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeParams(params) {
               expect(params).toEqual({ a: 1 })
               return fallbackOptions.serializeParams(params)
            },
         }))
         await upfetch('path?b=2', { params: { a: 1 } })
      })

      test('should be called even if no params are defined', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeParams() {
               count++
               return ''
            },
         }))
         await upfetch('')
         expect(count).toEqual(2)
      })

      test('should allow upfetch.serializeParams to override up.serializeParams', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               expect(new URL(request.url).search).toEqual('?from=upfetch')

               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeParams: () => 'from=up',
         }))
         await upfetch('', { serializeParams: () => 'from=upfetch' })
      })
   })

   describe('serializeBody', () => {
      test.each`
         body                            | shouldCallSerializeBody
         ${{}}                           | ${true}
         ${{ a: 1 }}                     | ${true}
         ${[1, 2]}                       | ${true}
         ${bodyMock.classJsonifiable}    | ${true}
         ${bodyMock.classNonJsonifiable} | ${true}
         ${bodyMock.buffer}              | ${true}
         ${bodyMock.dataview}            | ${true}
         ${bodyMock.blob}                | ${true}
         ${bodyMock.typedArray}          | ${true}
         ${bodyMock.formData}            | ${true}
         ${bodyMock.urlSearchParams}     | ${true}
         ${bodyMock.stream}              | ${true}
         ${''}                           | ${true}
         ${0}                            | ${true}
         ${undefined}                    | ${false}
         ${null}                         | ${false}
      `(
         'Should be called on any non-nullish an non-string body',
         async ({ body, shouldCallSerializeBody }) => {
            server.use(
               http.post('https://example.com', async ({ request }) => {
                  let actualBody = await request.text()
                  expect(actualBody === 'serialized').toBe(
                     shouldCallSerializeBody,
                  )

                  return HttpResponse.json({ hello: 'world' }, { status: 200 })
               }),
            )

            let upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
               method: 'POST',
            }))
            await upfetch('', {
               body,
               serializeBody: () => 'serialized',
               // @ts-ignore the global fetch type does not include "duplex"
               duplex: body === bodyMock.stream ? 'half' : undefined,
            })
         },
      )

      test('serializeBody in upfetch should override serializeBody in up', async () => {
         server.use(
            http.post('https://example.com', async ({ request }) => {
               expect(await request.text()).toEqual('from=upfetch')

               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeBody: () => 'from=up',
         }))
         await upfetch('', {
            body: { a: 1 },
            method: 'POST',
            serializeBody: () => 'from=upfetch',
         })
      })
   })

   describe('parseResponse', () => {
      test('should parse JSON responses by default', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         let data = await upfetch('')
         expect(data).toEqual({ hello: 'world' })
      })

      test('should parse TEXT responses by default', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.text('some text', { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         let data = await upfetch('')
         expect(data).toEqual('some text')
      })

      test('should provide response and options to parseResponse function', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.text('some text', { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse(res, options) {
               expect(res instanceof Response).toEqual(true)
               expect(options.input).toEqual('https://example.com')
               return res.text()
            },
         }))
         await upfetch('')
      })

      test('should execute parseResponse before onSuccess callback', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.text('some text', { status: 200 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse(res) {
               expect(count).toEqual(1)
               count++
               return res.text()
            },
            onSuccess() {
               expect(count).toEqual(2)
               count++
            },
         }))
         await upfetch('')
         expect(count).toEqual(3)
      })

      test('should also receive responses with empty body', async () => {
         server.use(
            http.get('https://example.com', () => {
               return new Response(null, { status: 200 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse(res) {
               expect(res.body).toEqual(null)
               expect(count).toEqual(1)
               count++
               return res.text()
            },
         }))
         await upfetch('')
         expect(count).toEqual(2)
      })

      test('should allow upfetch.parseResponse to override up.parseResponse', async () => {
         server.use(
            http.post('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse: () => Promise.resolve('from=up'),
         }))
         let data = await upfetch('', {
            body: { a: 1 },
            method: 'POST',
            parseResponse: () => Promise.resolve('from=upfetch'),
         })

         expect(data).toEqual('from=upfetch')
      })
   })

   describe('parseResponseError', () => {
      test('should parse JSON error responses by default', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         await upfetch('').catch((error) => {
            expect(error.data).toEqual({ hello: 'world' })
         })
      })

      test('should parse TEXT error responses by default', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.text('some text', { status: 400 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         await upfetch('').catch((error) => {
            expect(error.data).toEqual('some text')
         })
      })

      test('should provide response and options to parseResponseError', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.text('some text', { status: 400 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponseError(res, options) {
               expect(res instanceof Response).toEqual(true)
               expect(options.input).toEqual('https://example.com')
               return res.text()
            },
         }))
         await upfetch('').catch((error) => {
            expect(error).toEqual('some text')
         })
      })

      test('should execute parseResponseError before onError callback', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.text('some text', { status: 400 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponseError(res) {
               expect(count).toEqual(1)
               count++
               return res.text()
            },
            onError() {
               expect(count).toEqual(2)
               count++
            },
         }))
         await upfetch('').catch(() => {
            expect(count).toEqual(3)
         })
      })

      test('should receive error responses with empty body', async () => {
         server.use(
            http.get('https://example.com', () => {
               return new Response(null, { status: 300 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponseError(res) {
               expect(res.body).toEqual(null)
               expect(count).toEqual(1)
               count++
               return Promise.resolve('some error')
            },
         }))
         await upfetch('').catch((error) => expect(error).toEqual('some error'))
         expect(count).toEqual(2)
      })

      test('should allow upfetch.parseResponseError to override up.parseResponseError', async () => {
         server.use(
            http.post('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponseError: () => Promise.resolve('from=up'),
         }))
         await upfetch('', {
            body: { a: 1 },
            method: 'POST',
            parseResponseError: () => Promise.resolve('from=upfetch'),
         }).catch((error) => {
            expect(error).toEqual('from=upfetch')
         })
      })
   })

   describe('onError', () => {
      test('should receive validation errors', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )
         let exec = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onError(error, options) {
               if (isValidationError(error)) {
                  exec++
                  expectTypeOf(error).toEqualTypeOf<ValidationError>()
               }
            },
         }))

         await upfetch('', {
            schema: z.object({ hello: z.number() }),
         }).catch(() => {})
         expect(exec).toBe(1)
      })

      test('should receive the response errors', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )
         let exec = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onError(error, options) {
               if (isResponseError(error)) {
                  exec++
                  expectTypeOf(error).toEqualTypeOf<ResponseError>()
               }
            },
         }))

         await upfetch('', {}).catch(() => {})
         expect(exec).toBe(1)
      })

      test('should receive any error', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let exec = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onError(error, options) {
               exec++
               expectTypeOf(error).toEqualTypeOf<any>()
            },
         }))

         await upfetch('', {
            parseResponse: () => {
               throw new Error('any error')
            },
         }).catch(() => {})
         expect(exec).toBe(1)
      })
   })

   describe('onSuccess', () => {
      test('should execute onSuccess when no error occurs', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onSuccess() {
               expect(count).toBe(0)
               count++
            },
         }))

         await upfetch('')
         expect(count).toBe(1)
      })

      test('should provide validated data and options to onSuccess callback', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onSuccess(data, options) {
               expect(data).toEqual({ hello: 'world!' })
               expect(options.input).toEqual('https://example.com')
            },
         }))

         await upfetch('', {
            schema: object({
               hello: pipe(
                  string(),
                  transform((v) => (v += '!')),
               ),
            }),
         })
      })

      test('should skip onSuccess when parseResponse throws an error', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onSuccess() {
               count++
               throw new Error('onSuccess should not be called')
            },
            parseResponse: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('').catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(1)
      })
   })

   describe('onRequest', () => {
      test('should execute onRequest', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onRequest() {
               expect(count).toBe(0)
               count++
            },
         }))

         await upfetch('')
         expect(count).toBe(1)
      })

      test('should provide complete options object to onRequest callback', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onRequest(options) {
               expect(options.input).toBe('https://example.com')
            },
         }))

         await upfetch('')
      })
   })

   describe('timeout', () => {
      test('should apply up.timeout when upfetch.timeout is not defined', async () => {
         server.use(
            http.get('https://example.com', async () => {
               await scheduler.wait(2)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            timeout: 1,
         }))

         let exec = 0
         await upfetch('').catch((error) => {
            exec++
            expect(error.name).toBe('TimeoutError')
         })
         expect(exec).toBe(1)
      })

      test('should allow upfetch.timeout to override up.timeout', async () => {
         server.use(
            http.get('https://example.com', async () => {
               await scheduler.wait(2)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            timeout: undefined,
         }))

         let exec = 0
         await upfetch('').catch((error) => {
            exec++
            expect(error.name).toBe('TimeoutError')
         })
         expect(exec).toBe(0)
      })

      test('should maintain timeout functionality when an AbortSignal is passed to upfetch.signal', async () => {
         server.use(
            http.get('https://example.com', async () => {
               await scheduler.wait(2)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            timeout: 1,
         }))

         let exec = 0
         await upfetch('', {
            signal: new AbortController().signal,
         }).catch((error) => {
            exec++
            expect(error.name).toBe('TimeoutError')
         })
         expect(exec).toBe(1)
      })

      test('should maintain upfetch.signal functionality when timeout is defined', async () => {
         server.use(
            http.get('https://example.com', async () => {
               await scheduler.wait(10000)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            timeout: 9000,
         }))

         let exec = 0
         let controller = new AbortController()
         let signal = controller.signal
         let promise = upfetch('', {
            signal,
         }).catch((error) => {
            exec++
            expect(error.name).toBe('AbortError')
         })
         controller.abort()
         await promise
         expect(exec).toBe(1)
      })

      describe('environment compatibility', () => {
         beforeAll(() => {
            vi.stubGlobal('AbortSignal', {})
         })

         afterAll(() => {
            vi.unstubAllGlobals()
         })

         test('should gracefully handle environments without AbortSignal.any and AbortSignal.timeout', async () => {
            server.use(
               http.get('https://example.com', async () => {
                  await scheduler.wait(2)
                  return HttpResponse.json({ hello: 'world' }, { status: 200 })
               }),
            )

            let upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
            }))

            let controller = new AbortController()
            let signal = controller.signal
            await upfetch('', {
               // having both timeout and signal will use AbortSignal.any
               timeout: 1,
               signal,
            })
         })
      })
   })
})
