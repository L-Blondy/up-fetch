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

describe('up', () => {
   let server = setupServer()
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())

   describe('throwResponseError', () => {
      test('Should throw by default if !response.ok', async () => {
         server.use(
            http.get('https://example.com', async () => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let catchCount = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))

         await upfetch('').catch((error) => {
            expect(isResponseError(error)).toEqual(true)
            catchCount++
         })
         expect(catchCount).toEqual(1)
      })

      test('Should not throw if () => false', async () => {
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

      test('Should be called before the up parseResponseError', async () => {
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

      test('Should be called before the upfetch parseResponseError', async () => {
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

      test('Should support async functions', async () => {
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
      test('Should be ignored in up', async () => {
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
         'Should automatically have "content-type: application/json" if the body is jsonifiable and the serialized body is a string',
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
         'Should NOT automatically have "content-type: application/json" if the body is jsonifiable BUT the serialized body is NOT a string',
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
         'If the "content-type" header is declared, "application/json" should not be added',
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

      test('upfetch headers should override up headers', async () => {
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

      test('`undefined` can be used on upfetch headers to remove upOption headers', async () => {
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
      test('input params should override defaultOptions params', async () => {
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

      test('upfetch params and input params should both live in the url search (the user is responsible for not duplicating)', async () => {
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

      test('`undefined` can be used on upfetch params to remove upOption params', async () => {
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

         await upfetch('/', (defaultOptions) => ({
            params: { hello: defaultOptions.params.hello, input: undefined },
         }))
      })
   })

   describe('serializeParams', () => {
      test('Should receive the params', async () => {
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

      test('Should not receive the params defined in the url itself', async () => {
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

      test('Should be called even if no params are defined', async () => {
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

      test('serializeParams in upfetch should override serializeParams in up', async () => {
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
      test('Should receive the body', async () => {
         server.use(
            http.post('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeBody(body) {
               expect(body).toEqual({ a: 1 })
               return ''
            },
         }))
         await upfetch('', { body: { a: 1 }, method: 'POST' })
      })

      test.each`
         body                            | isSerialized
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
         ${bodyMock.stream}              | ${false}
         ${''}                           | ${false}
         ${0}                            | ${false}
         ${undefined}                    | ${false}
         ${null}                         | ${false}
      `(
         'Should be called when body is an Array, a plain Object or a class with a JSON method',
         async ({ body, isSerialized }) => {
            server.use(
               http.post('https://example.com', async ({ request }) => {
                  let actualBody = await request.text()
                  expect(actualBody === 'serialized').toBe(isSerialized)

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
      test('Should parse JSON by default', async () => {
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

      test('Should parse TEXT by default', async () => {
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

      test('Should receive res, options as parameters', async () => {
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

      test('Should be called before onSuccess', async () => {
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

      test('Should be called even if the response has no body', async () => {
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

      test('parseResponse in upfetch should override parseResponse in up', async () => {
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
      test('Should parse JSON by default', async () => {
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

      test('Should parse TEXT by default', async () => {
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

      test('Should receive res, options, defaultParser as parameters', async () => {
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

      test('Should be called before onError', async () => {
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

      test('Should be called even if the response has no body', async () => {
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

      test('parseResponseError in upfetch should override parseResponseError in up', async () => {
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
      test('Should catch the validation errors', async () => {
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

      test('Should catch the response errors', async () => {
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

      test('Should catch the any error', async () => {
         let exec = 0

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onError(error, options) {
               exec++
               expectTypeOf(error).toEqualTypeOf<any>()
            },
         }))

         await upfetch('not found', {}).catch(() => {})
         expect(exec).toBe(1)
      })
   })

   describe('onSuccess', () => {
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onSuccess() {
               expect(count).toBe(1)
               count++
            },
         }))

         await upfetch('')
         expect(count).toBe(2)
      })

      test('Should receive the validated data and the options', async () => {
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

      test('Should not be called when parseResponse throws', async () => {
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
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            http.get('https://example.com', () => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         let upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onRequest() {
               expect(count).toBe(1)
               count++
            },
         }))

         await upfetch('')
         expect(count).toBe(2)
      })

      test('Should receive the options', async () => {
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
      test('Default timeout should apply if not fetcher timeout is defined', async () => {
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

      test('the default timeout should be overriden by the fetcher timeout', async () => {
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

      test('The timeout should still work along with a signal', async () => {
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

      test('The signal should still work along with a timeout', async () => {
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

      describe('Environnement compatibility', () => {
         beforeAll(() => {
            vi.stubGlobal('AbortSignal', {})
         })

         afterAll(() => {
            vi.unstubAllGlobals()
         })

         test('Should not crash if AbortSignal.any and AbortSignal.timeout are not supported', async () => {
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
