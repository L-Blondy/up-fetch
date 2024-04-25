import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from './up'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { isResponseError } from './response-error'
import { bodyMock } from './_mocks'
import { fallbackOptions } from './fallback-options'

describe('up', () => {
   const server = setupServer()
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())

   test('Should throw if !res.ok', async () => {
      server.use(
         http.get('https://example.com', async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
      }))

      await upfetch('').catch((error) => {
         expect(isResponseError(error)).toEqual(true)
         catchCount++
      })
      expect(catchCount).toEqual(1)
   })

   describe('body', () => {
      test('Should be ignored in up', async () => {
         server.use(
            http.post('https://example.com', async ({ request }) => {
               const body = await request.text()
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

         const upfetch = up(fetch, () => ({
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
                  const hasApplicationJsonHeader =
                     request.headers.get('content-type') === 'application/json'
                  expect(hasApplicationJsonHeader).toEqual(expected)
                  return HttpResponse.json({ hello: 'world' }, { status: 200 })
               }),
            )

            const upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
               method: 'POST',
               serializeBody: (body) => JSON.stringify(body),
            }))
            await upfetch('', {
               body,
               // @ts-ignore the global fetch type does not include "duplex"
               duplex: (body as any)?.getReader ? 'half' : undefined,
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
                  const hasApplicationJsonHeader =
                     request.headers.get('content-type') === 'application/json'
                  expect(hasApplicationJsonHeader).toEqual(expected)
                  return HttpResponse.json({ hello: 'world' }, { status: 200 })
               }),
            )

            const upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
               method: 'POST',
               serializeBody: () => new FormData(),
            }))
            await upfetch('', {
               body,
               // @ts-ignore the global fetch type does not include "duplex"
               duplex: (body as any)?.getReader ? 'half' : undefined,
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

            const upfetch = up(fetch, () => ({
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

         const upfetch = up(fetch, () => ({
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

         const upfetch = up(fetch, () => ({
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

         const upfetch = up(fetch, () => ({
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

         const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

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

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            params: { hello: 'world', input: 'test' },
         }))

         await upfetch('/', {
            params: { input: undefined },
         })

         await upfetch('/', (defaultOptions) => ({
            params: { hello: defaultOptions.params?.hello, input: undefined },
         }))
      })
   })

   describe('serializeParams', () => {
      test('Should receive the params', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
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

         const upfetch = up(fetch, () => ({
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
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
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

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeParams: () => 'from=up',
         }))
         await upfetch('', { serializeParams: () => 'from=upfetch' })
      })
   })

   describe('serializeBody', () => {
      test('Should receive the body', async () => {
         server.use(
            http.post('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
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
                  const actualBody = await request.text()
                  expect(actualBody === 'serialized').toBe(isSerialized)

                  return HttpResponse.json({ hello: 'world' }, { status: 200 })
               }),
            )

            const upfetch = up(fetch, () => ({
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

         const upfetch = up(fetch, () => ({
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
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         const data = await upfetch('')
         expect(data).toEqual({ hello: 'world' })
      })

      test('Should parse TEXT by default', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.text('some text', { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         const data = await upfetch('')
         expect(data).toEqual('some text')
      })

      test('Should receive res, options as parameters', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.text('some text', { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse(res, options) {
               expect(res instanceof Response).toEqual(true)
               expect(options.input).toEqual('https://example.com/')
               return res.text()
            },
         }))
         await upfetch('')
      })

      test('Should be called before onSuccess', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.text('some text', { status: 200 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
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
            http.get('https://example.com', ({ request }) => {
               return new Response(null, { status: 200 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
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
            http.post('https://example.com', async ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse: () => Promise.resolve('from=up'),
         }))
         const data = await upfetch('', {
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
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         await upfetch('').catch((error) => {
            expect(error.data).toEqual({ hello: 'world' })
         })
      })

      test('Should parse TEXT by default', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.text('some text', { status: 400 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         await upfetch('').catch((error) => {
            expect(error.data).toEqual('some text')
         })
      })

      test('Should receive res, options, defaultParser as parameters', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.text('some text', { status: 400 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponseError(res, options) {
               expect(res instanceof Response).toEqual(true)
               expect(options.input).toEqual('https://example.com/')
               return res.text()
            },
         }))
         await upfetch('').catch((error) => {
            expect(error).toEqual('some text')
         })
      })

      test('Should be called before onResponseError', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.text('some text', { status: 400 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponseError(res) {
               expect(count).toEqual(1)
               count++
               return res.text()
            },
            onResponseError() {
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
            http.get('https://example.com', ({ request }) => {
               return new Response(null, { status: 300 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
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
            http.post('https://example.com', async ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         const upfetch = up(fetch, () => ({
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

   describe('onSuccess', () => {
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onSuccess() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('', {
            onSuccess() {
               expect(count).toEqual(1)
               count++
            },
         })
         expect(count).toBe(3)
      })

      test('Should receive the parsedResponse and the options', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onSuccess(data, options) {
               expect(data).toEqual({ hello: 'world' })
               expect(options.input).toEqual('https://example.com/')
            },
         }))

         await upfetch('', {
            onSuccess(data, options) {
               expect(data).toEqual({ hello: 'world' })
               expect(options.input).toEqual('https://example.com/')
            },
         })
      })

      test('Should not be called when parseResponse throws', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onSuccess() {
               count++
               throw new Error('onSuccess should not be called')
            },
            parseResponse: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('', {
            onSuccess() {
               count++
               throw new Error('onSuccess should not be called')
            },
         }).catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(1)
      })
   })

   describe('onParsingError', () => {
      test('on parseResponse error, should be called on upfetch, then on up', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse: () => {
               throw new Error('error message')
            },
            onParsingError() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('', {
            onParsingError() {
               expect(count).toEqual(1)
               count++
            },
         }).catch((error) => {
            expect(count).toBe(3)
            count++
            expect(error.message).toBe('error message')
         })

         expect(count).toBe(4)
      })

      test('on parseResponseError error, should be called on upfetch, then on up', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponseError: () => {
               throw new Error('error message')
            },
            onParsingError() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('', {
            onParsingError() {
               expect(count).toEqual(1)
               count++
            },
         }).catch((error) => {
            expect(count).toBe(3)
            count++
            expect(error.message).toBe('error message')
         })

         expect(count).toBe(4)
      })

      test('Should receive the error and the options', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse: () => {
               throw new Error('error message')
            },
            onParsingError(error, options) {
               expect(error.message).toEqual('error message')
               expect(options.input).toEqual('https://example.com/')
            },
         }))

         await upfetch('', {
            onParsingError(error, options) {
               expect(error.message).toEqual('error message')
               expect(options.input).toEqual('https://example.com/')
            },
         }).catch((error) => {
            expect(error.message).toBe('error message')
         })
      })

      test('Should not be called when onSuccess throws', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )
         let count = 0

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onSuccess(data, options) {
               throw new Error('on success error')
            },
            onParsingError() {
               count++
            },
         }))

         await upfetch('', {
            onSuccess(data, options) {
               count++
               throw new Error('on success error')
            },
            onParsingError() {
               count++
            },
         }).catch(() => {})

         expect(count).toBe(1)
      })
      test('Should not be called when onResponseError throws', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )
         let count = 0

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onResponseError(error, options) {
               throw new Error('on response error')
            },
            onParsingError() {
               count++
            },
         }))

         await upfetch('', {
            onResponseError(error, options) {
               count++
               throw new Error('on response error')
            },
            onParsingError() {
               count++
            },
         }).catch(() => {})

         expect(count).toBe(1)
      })
   })

   describe('onResponseError', () => {
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onResponseError() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('', {
            onResponseError() {
               expect(count).toEqual(1)
               count++
            },
         }).catch((error) => {
            expect(isResponseError(error)).toBe(true)
         })

         expect(count).toBe(3)
      })

      test('Should receive the parsedResponseError and the options', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onResponseError(error, options) {
               expect(error.data).toEqual({ hello: 'world' })
               expect(options.input).toEqual('https://example.com/')
            },
         }))

         await upfetch('', {
            onResponseError(error, options) {
               expect(error.data).toEqual({ hello: 'world' })
               expect(options.input).toEqual('https://example.com/')
            },
         }).catch((error) => {
            expect(isResponseError(error)).toBe(true)
         })
      })

      test('Should not be called when parseResponseError throws', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 400 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onResponseError() {
               count++
               throw new Error('onSuccess should not be called')
            },
            parseResponseError: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('', {
            onResponseError() {
               count++
               throw new Error('onSuccess should not be called')
            },
         }).catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(1)
      })
   })

   describe('onRequestError', () => {
      test('Should be called on upfetch, then on up', async () => {
         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            onRequestError() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('', {
            onRequestError() {
               expect(count).toEqual(1)
               count++
            },
         }).catch((error) => {
            expect(isResponseError(error)).toBe(false)
         })

         expect(count).toBe(3)
      })

      test('Should receive the error and the options', async () => {
         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            onRequestError(error, options) {
               expect(error instanceof Error).toBe(true)
               expect(options.input).toBe('https://example.coms/')
            },
         }))

         await upfetch('', {
            onRequestError(error, options) {
               expect(error instanceof Error).toBe(true)
               expect(options.input).toBe('https://example.coms/')
            },
         }).catch((error) => {
            expect(error instanceof Error).toBe(true)
         })
      })
   })

   describe('onBeforeFetch', () => {
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onBeforeFetch() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('', {
            onBeforeFetch() {
               expect(count).toEqual(1)
               count++
            },
         })
         expect(count).toBe(3)
      })

      test('Should receive the options', async () => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onBeforeFetch(options) {
               expect(options.input).toBe('https://example.com/')
            },
         }))

         await upfetch('', {
            onBeforeFetch(options) {
               expect(options.input).toBe('https://example.com/')
            },
         })
      })
   })
})
