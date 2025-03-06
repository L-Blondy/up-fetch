import { scheduler } from 'node:timers/promises'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { object, pipe, string, transform } from 'valibot'
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
import { z } from 'zod'
import {
   type FetcherOptions,
   type ResponseError,
   type ValidationError,
   isJsonifiable,
   isResponseError,
   isValidationError,
   up,
} from '.'
import { bodyMock } from './_mocks'
import { fallbackOptions } from './fallback-options'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('isJsonifiable', () => {
   test.each`
      body                            | output
      ${bodyMock.buffer}              | ${false}
      ${bodyMock.dataview}            | ${false}
      ${bodyMock.blob}                | ${false}
      ${bodyMock.typedArray}          | ${false}
      ${bodyMock.formData}            | ${false}
      ${bodyMock.urlSearchParams}     | ${false}
      ${bodyMock.stream}              | ${false}
      ${bodyMock.classNonJsonifiable} | ${false}
      ${bodyMock.classJsonifiable}    | ${true}
      ${{ q: 'q' }}                   | ${true}
      ${[1, 2]}                       | ${true}
      ${''}                           | ${false}
      ${0}                            | ${false}
      ${undefined}                    | ${false}
      ${null}                         | ${false}
   `('Input: $body', ({ body, output }) => {
      expect(isJsonifiable(body)).toEqual(output)
   })
})

describe('Should receive the upfetch arguments (up to 3)', () => {
   test.each`
      input                             | options                 | ctx
      ${'https://example.com'}          | ${{ method: 'DELETE' }} | ${{ is: 'ctx' }}
      ${new URL('https://example.com')} | ${{ method: 'DELETE' }} | ${'context'}
   `('%#', async ({ input, options, ctx }) => {
      server.use(
         http.delete('https://example.com', () => {
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

describe('reject', () => {
   test('should throw ResponseError by default when response.ok is false', async () => {
      server.use(
         http.get('https://example.com', async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      let catchCount = 0

      const upfetch = up(fetch, (input) => ({
         baseUrl: 'https://example.com',
      }))

      await upfetch('').catch((error) => {
         expect(isResponseError(error)).toEqual(true)
         catchCount++
      })
      expect(catchCount).toEqual(1)
   })

   test('should not throw when reject returns false', async () => {
      server.use(
         http.get('https://example.com', async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         reject: () => false,
      }))

      await upfetch('').catch(() => {
         catchCount++
      })
      expect(catchCount).toEqual(0)
   })

   test('should execute reject before up.parseRejected', async () => {
      server.use(
         http.get('https://example.com', async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         reject: () => {
            expect(catchCount).toBe(0)
            catchCount++
            return true
         },
         parseRejected: async (e) => {
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

   test('should execute reject before upfetch.parseRejected', async () => {
      server.use(
         http.get('https://example.com', async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         reject: () => {
            expect(catchCount).toBe(0)
            catchCount++
            return true
         },
      }))

      await upfetch('', {
         parseRejected: async (e) => {
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

   test('should support asynchronous reject functions', async () => {
      server.use(
         http.get('https://example.com', async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         reject: async () => {
            return new Promise((resolve) => {
               catchCount++
               setTimeout(() => resolve(true), 100)
            })
         },
      }))

      await upfetch('', {
         parseRejected: async (e) => {
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
   test('should ignore up.body', async () => {
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
            duplex: body?.getReader ? 'half' : undefined,
         })
      })
   })

   describe('should not set content-type to application/json when body is jsonifiable but serializes to non-string', () => {
      test.each`
         body                         | expected
         ${{}}                        | ${false}
         ${{ a: 1 }}                  | ${false}
         ${[1, 2]}                    | ${false}
         ${bodyMock.classJsonifiable} | ${false}
      `('%#', async ({ body, expected }) => {
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
            duplex: body?.getReader ? 'half' : undefined,
         })
      })
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
            http.post('https://example.com', async ({ request }) => {
               expect(request.headers.get('content-type')).toEqual('html/text')
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
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
            http.post('https://example.com', async ({ request }) => {
               expect(
                  Object.fromEntries([...request.headers.entries()]),
               ).toEqual(finalHeaders)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            headers: upHeaders,
         }))
         await upfetch('https://example.com', {
            headers: upfetchHeaders,
            method: 'POST',
         })
      })
   })

   test('should support removing an up.headers[key] by setting upfetch.headers[key] to undefined', async () => {
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
   describe('should merge up.params and upfetch.params with input URL params. Priority: up.params < input.search < upfetch.params', () => {
      test.each`
         input                                           | upParams              | upfetchParams          | finalUrl
         ${'https://example.com/?input=param'}           | ${{ come: 'on' }}     | ${{ hello: 'people' }} | ${'https://example.com/?input=param&come=on&hello=people'}
         ${new URL('https://example.com/?input=param')}  | ${{ come: 'on' }}     | ${{ hello: 'people' }} | ${'https://example.com/?input=param&come=on&hello=people'}
         ${'https://example.com/?hello=people'}          | ${{ hello: 'world' }} | ${{}}                  | ${'https://example.com/?hello=people'}
         ${new URL('https://example.com/?hello=people')} | ${{ hello: 'world' }} | ${{}}                  | ${'https://example.com/?hello=people'}
         ${'https://example.com/?hello=people'}          | ${{ hello: 'world' }} | ${{ hello: 'test' }}   | ${'https://example.com/?hello=people&hello=test'}
         ${new URL('https://example.com/?hello=people')} | ${{ hello: 'world' }} | ${{ hello: 'test' }}   | ${'https://example.com/?hello=people&hello=test'}
      `('%#', async ({ input, upParams, upfetchParams, finalUrl }) => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               expect(request.url).toEqual(finalUrl)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            params: upParams,
         }))

         await upfetch(input, {
            params: upfetchParams,
         })
      })
   })

   test('should support removing an up.params[key] by setting upfetch.params[key] to undefined', async () => {
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
   })

   test('should strip top level undefined values from the queryString', async () => {
      server.use(
         http.get('https://example.com', ({ request }) => {
            expect(request.url).toEqual('https://example.com/')
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         params: { key: 'value' },
      }))

      await upfetch('https://example.com', {
         params: { key: undefined },
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

      const upfetch = up(fetch, () => ({
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

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         serializeParams(params) {
            expect(params).toEqual({ a: 1 })
            return fallbackOptions.serializeParams(params)
         },
      }))
      await upfetch('path?b=2', { params: { a: 1 } })
   })

   describe('should allow returning a string with and without question mark', () => {
      test.each`
         serializeParams
         ${() => 'should=work'}
         ${() => '?should=work'}
      `('%#', async ({ serializeParams }) => {
         server.use(
            http.get('https://example.com', ({ request }) => {
               expect(new URL(request.url).search).toEqual('?should=work')

               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeParams,
         }))
         await upfetch('/')
      })
   })

   test('should be called even if no params are defined', async () => {
      server.use(
         http.get('https://example.com', () => {
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

   test('should allow upfetch.serializeParams to override up.serializeParams', async () => {
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
               const actualBody = await request.text()
               expect(actualBody === 'serialized').toBe(shouldCallSerializeBody)

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
   test('should parse JSON responses by default', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
      }))
      const data = await upfetch('')
      expect(data).toEqual({ hello: 'world' })
   })

   test('should parse TEXT responses by default', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.text('some text', { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
      }))
      const data = await upfetch('')
      expect(data).toEqual('some text')
   })

   test('should provide response and request to parseResponse function', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.text('some text', { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         parseResponse(res, request) {
            expect(res instanceof Response).toEqual(true)
            expect(request.url).toEqual('https://example.com/')
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

   test('should also receive responses with empty body', async () => {
      server.use(
         http.get('https://example.com', () => {
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

   test('should allow upfetch.parseResponse to override up.parseResponse', async () => {
      server.use(
         http.post('https://example.com', async () => {
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

describe('parseRejected', () => {
   test('should parse JSON error responses by default', async () => {
      server.use(
         http.get('https://example.com', () => {
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

   test('should parse TEXT error responses by default', async () => {
      server.use(
         http.get('https://example.com', () => {
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

   test('should provide response and request to parseRejected', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.text('some text', { status: 400 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         parseRejected(res, request) {
            expect(res instanceof Response).toEqual(true)
            expect(request.url).toEqual('https://example.com/')
            return res.text()
         },
      }))
      await upfetch('').catch((error) => {
         expect(error).toEqual('some text')
      })
   })

   test('should execute parseRejected before onError callback', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.text('some text', { status: 400 })
         }),
      )

      let count = 1

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         parseRejected(res) {
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

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         parseRejected(res) {
            expect(res.body).toEqual(null)
            expect(count).toEqual(1)
            count++
            return Promise.resolve('some error')
         },
      }))
      await upfetch('').catch((error) => expect(error).toEqual('some error'))
      expect(count).toEqual(2)
   })

   test('should allow upfetch.parseRejected to override up.parseRejected', async () => {
      server.use(
         http.post('https://example.com', async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         parseRejected: () => Promise.resolve('from=up'),
      }))
      await upfetch('', {
         body: { a: 1 },
         method: 'POST',
         parseRejected: () => Promise.resolve('from=upfetch'),
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

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         onError(error, request) {
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

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         onError(error, request) {
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

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         onError(error, request) {
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

   test('should ignore up.onError', async () => {
      server.use(
         http.get('https://example.com', async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )
      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
      }))

      await upfetch('', {
         schema: z.object({ hello: z.number() }),
         // @ts-expect-error invalid option
         onError() {
            exec++
         },
      }).catch(() => {})
      expect(exec).toBe(0)
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

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         onSuccess() {
            expect(count).toBe(0)
            count++
         },
      }))

      await upfetch('')
      expect(count).toBe(1)
   })

   test('should provide validated data and request to onSuccess callback', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         onSuccess(data, request) {
            expect(data).toEqual({ hello: 'world!' })
            expect(request.url).toEqual('https://example.com/')
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

      await upfetch('').catch((error) => {
         expect(error.message).toEqual('Some error')
      })
      expect(count).toBe(1)
   })

   test('should ignore up.onSuccess', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let count = 0

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
      }))

      await upfetch('', {
         // @ts-expect-error invalid option
         onSuccess() {
            count++
         },
      })
      expect(count).toBe(0)
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

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         onRequest() {
            expect(count).toBe(0)
            count++
         },
      }))

      await upfetch('')
      expect(count).toBe(1)
   })

   test('should provide request object to onRequest callback', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         onRequest(request) {
            expect(request.url).toBe('https://example.com/')
         },
      }))

      await upfetch('')
   })

   test('should ignore up.onRequest', async () => {
      server.use(
         http.get('https://example.com', () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let count = 0

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
      }))

      await upfetch('', {
         // @ts-expect-error invalid option
         onRequest() {
            count++
         },
      })
      expect(count).toBe(0)
   })
})

describe('timeout', () => {
   const majorNodeVersion = Number(
      process.version.replace('v', '').split('.')[0],
   )

   // test for node 18 & 19
   test('Should not crash', async () => {
      server.use(
         http.get('https://example.com', async () => {
            return HttpResponse.json({}, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://example.com',
         timeout: 1,
      }))

      await upfetch('')
   })

   if (majorNodeVersion >= 20) {
      test('should apply up.timeout when upfetch.timeout is not defined', async () => {
         server.use(
            http.get('https://example.com', async () => {
               await scheduler.wait(2)
               return HttpResponse.json({}, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
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
               return HttpResponse.json({}, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
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
               return HttpResponse.json({}, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
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
               return HttpResponse.json({}, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            timeout: 9000,
         }))

         let exec = 0
         const controller = new AbortController()
         const signal = controller.signal
         const promise = upfetch('', {
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
                  return HttpResponse.json({}, { status: 200 })
               }),
            )

            const upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
            }))

            const controller = new AbortController()
            const signal = controller.signal
            await upfetch('', {
               // having both timeout and signal will use AbortSignal.any
               timeout: 1,
               signal,
            })
         })
      })
   }
})
