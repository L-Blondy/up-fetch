import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from './up.js'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { isResponseError } from './response-error.js'
import { bodyMock } from './_mocks.js'

describe('up', () => {
   const server = setupServer()
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())

   test('Should throw if !res.ok', async () => {
      server.use(
         rest.get('https://example.com', async (req, res, ctx) => {
            return res(ctx.json({ hello: 'world' }), ctx.status(400))
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
      test('Should be ignore in up options', async () => {
         server.use(
            rest.post('https://example.com', async (req, res, ctx) => {
               const body = await req.text()
               if (count === 1) {
                  expect(body).toBe('')
               }
               if (count === 2) {
                  expect(body).toBe('my body')
               }
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
         'Should automatically have "content-type: application/json" if the body is serializable',
         async ({ body, expected }) => {
            server.use(
               rest.post('https://example.com', async (req, res, ctx) => {
                  const hasApplicationJsonHeader =
                     req.headers.get('content-type') === 'application/json'
                  expect(hasApplicationJsonHeader).toEqual(expected)
                  return res(ctx.json({ hello: 'world' }), ctx.status(200))
               }),
            )

            const upfetch = up(fetch, () => ({
               baseUrl: 'https://example.com',
               method: 'POST',
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
               rest.post('https://example.com', async (req, res, ctx) => {
                  expect(req.headers.get('content-type')).toEqual('html/text')
                  return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.post('https://example.com', async (req, res, ctx) => {
               expect(req.headers.get('content-type')).toEqual('from upfetch')
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.post('https://example.com', async (req, res, ctx) => {
               expect(req.headers.get('content-type')).toEqual(null)
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
      test('input params should override upOptions params', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               expect(req.url.search).toEqual('?hello=people')
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               expect(req.url.search).toEqual(
                  '?input=param&hello=people&input=test',
               )
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
            }),
         )

         const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

         await upfetch('/?input=param', {
            params: { hello: 'people', input: 'test' },
         })
      })

      test('`undefined` can be used on upfetch params to remove upOption params', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               expect(req.url.search).toEqual('?hello=world')
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            params: { hello: 'world', input: 'test' },
         }))

         await upfetch('/', {
            params: { input: undefined },
         })

         await upfetch('/', (upOptions) => ({
            params: { hello: upOptions.params?.hello, input: undefined },
         }))
      })
   })

   describe('serializeParams', () => {
      test('Should receive the params and the default serializer', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeParams(params, defaultSerializer) {
               expect(params).toEqual({ a: 1 })
               expect(typeof defaultSerializer).toEqual('function')
               return ''
            },
         }))
         await upfetch('', { params: { a: 1 } })
      })

      test('Should not receive the params defined in the url itself', async () => {
         server.use(
            rest.get('https://example.com/path', (req, res, ctx) => {
               expect(req.url.search).toEqual('?b=2&a=1')
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeParams(params, defaultSerializer) {
               expect(params).toEqual({ a: 1 })
               return defaultSerializer(params)
            },
         }))
         await upfetch('path?b=2', { params: { a: 1 } })
      })

      test('Should be called even if no params are defined', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               expect(req.url.search).toEqual('?from=upfetch')
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
      test('Should receive the body and the default serializer', async () => {
         server.use(
            rest.post('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            serializeBody(body, defaultSerializer) {
               expect(body).toEqual({ a: 1 })
               expect(typeof defaultSerializer).toEqual('function')
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
               rest.post('https://example.com', async (req, res, ctx) => {
                  const actualBody = await req.text()
                  expect(actualBody === 'serialized').toBe(isSerialized)
                  return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.post('https://example.com', async (req, res, ctx) => {
               expect(await req.text()).toEqual('from=upfetch')
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(200))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
         }))
         const data = await upfetch('')
         expect(data).toEqual('some text')
      })

      test('Should receive res, options, defaultParser as parameters', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(200))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponse(res, options, defaultParser) {
               expect(res instanceof Response).toEqual(true)
               expect(options.input).toEqual('https://example.com/')
               expect(typeof defaultParser).toEqual('function')
               return res.text()
            },
         }))
         await upfetch('')
      })

      test('Should be called before onSuccess', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.status(200))
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
            rest.post('https://example.com', async (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(400))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(400))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            parseResponseError(res, options, defaultParser) {
               expect(res instanceof Response).toEqual(true)
               expect(options.input).toEqual('https://example.com/')
               expect(typeof defaultParser).toEqual('function')
               return res.text()
            },
         }))
         await upfetch('').catch((error) => {
            expect(error).toEqual('some text')
         })
      })

      test('Should be called before onResponseError and onError', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(400))
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
            onError() {
               expect(count).toEqual(3)
               count++
            },
         }))
         await upfetch('').catch(() => {
            expect(count).toEqual(4)
         })
      })

      test('Should be called even if the response has no body', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.status(300))
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
            rest.post('https://example.com', async (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
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

   describe('parseUnknownError', () => {
      test('Should not transform the error by default', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
         }))
         await upfetch('').catch((error) => {
            expect(error instanceof Error).toEqual(true)
         })
      })

      test('Should receive res, options as parameters', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(400))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            parseUnknownError(error, options) {
               expect(error instanceof Error).toEqual(true)
               expect(options.input).toEqual('https://example.coms/')
               return 'Unknown Error'
            },
         }))
         await upfetch('').catch((error) => {
            expect(error).toEqual('Unknown Error')
         })
      })

      test('Should be called before onUnknownError and onError', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            parseUnknownError(res) {
               expect(count).toEqual(1)
               count++
               return 'Unknown Error'
            },
            onUnknownError() {
               expect(count).toEqual(2)
               count++
            },
            onError() {
               expect(count).toEqual(3)
               count++
            },
         }))
         await upfetch('').catch(() => {
            expect(count).toEqual(4)
         })
      })

      test('If parseUnknownError throws, onUnknownError & onError should still be called', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.text('some text'), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            parseUnknownError() {
               throw new Error('THROW')
            },
            onUnknownError(error) {
               expect(error.message).toEqual('THROW')
               expect(count).toEqual(1)
               count++
            },
            onError(error) {
               expect(error.message).toEqual('THROW')
               expect(count).toEqual(2)
               count++
            },
         }))
         await upfetch('').catch((error) => {
            expect(error.message).toEqual('THROW')
            expect(count).toEqual(3)
         })
      })

      test('parseUnknownError in upfetch should override parseUnknownError in up', async () => {
         server.use(
            rest.post('https://example.com', async (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            parseUnknownError: () => 'from=up',
         }))
         await upfetch('', {
            body: { a: 1 },
            method: 'POST',
            parseUnknownError: () => 'from=upfetch',
         }).catch((error) => {
            expect(error).toEqual('from=upfetch')
         })
      })
   })

   describe('onSuccess', () => {
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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

   describe('onResponseError', () => {
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
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

   describe('onUnknownError', () => {
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            onUnknownError() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('', {
            onUnknownError() {
               expect(count).toEqual(1)
               count++
            },
         }).catch((error) => {
            expect(isResponseError(error)).toBe(false)
         })

         expect(count).toBe(3)
      })

      test('Should receive the parsed unknown error and the options', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            parseUnknownError(error) {
               return 'Unknown error'
            },
            onUnknownError(error, options) {
               expect(error).toBe('Unknown error')
               expect(options.input).toBe('https://example.coms/')
            },
         }))

         await upfetch('', {
            onUnknownError(error, options) {
               expect(error).toBe('Unknown error')
               expect(options.input).toBe('https://example.coms/')
            },
         }).catch((error) => {
            expect(error).toEqual('Unknown error')
         })
      })

      test('Should be called once when parseResponse throws', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onUnknownError() {
               count++
            },
            parseResponse: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('', {
            onUnknownError() {
               count++
            },
         }).catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(3)
      })

      test('Should be called once when parseResponseError throws', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onUnknownError() {
               count++
            },
            parseResponseError: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('', {
            onUnknownError() {
               count++
            },
         }).catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(3)
      })

      test('Should be called once when parseUnknownError throws', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            onUnknownError() {
               count++
            },
            parseUnknownError: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('', {
            onUnknownError() {
               count++
            },
         }).catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(3)
      })
   })

   describe('onError', () => {
      test('Should be called after onResponseError', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onResponseError() {
               expect(count).toBe(1)
               count++
            },
            onError() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('').catch((error) => {
            expect(error.data).toEqual({ hello: 'world' })
         })

         expect(count).toBe(3)
      })

      test('Should be called after onUnknownError', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            parseUnknownError: () => 'Unknown Error',
            onUnknownError() {
               expect(count).toBe(1)
               count++
            },
            onError() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('').catch((error) => {
            expect(error).toEqual('Unknown Error')
         })
      })

      test('Should be called on upfetch, then on up', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            parseUnknownError: () => 'Unknown Error',
            onError() {
               expect(count).toBe(2)
               count++
            },
         }))

         await upfetch('', {
            onError() {
               expect(count).toEqual(1)
               count++
            },
         }).catch((error) => {
            expect(error).toBe('Unknown Error')
         })

         expect(count).toBe(3)
      })

      test('Should receive the error and the options', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onError(error, options) {
               expect(error.data).toEqual({ hello: 'world' })
               expect(options.input).toEqual('https://example.com/')
            },
         }))

         await upfetch('', {
            onError(error, options) {
               expect(error.data).toEqual({ hello: 'world' })
               expect(options.input).toEqual('https://example.com/')
            },
         }).catch((error) => {
            expect(isResponseError(error)).toBe(true)
         })
      })

      test('Should be called once when parseResponse throws', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onError() {
               count++
            },
            parseResponse: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('', {
            onError() {
               count++
            },
         }).catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(3)
      })

      test('Should be called once when parseResponseError throws', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.com',
            onError() {
               count++
            },
            parseResponseError: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('', {
            onError() {
               count++
            },
         }).catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(3)
      })

      test('Should be called once when parseUnknownError throws', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(400))
            }),
         )

         let count = 1

         const upfetch = up(fetch, () => ({
            baseUrl: 'https://example.coms',
            onError() {
               count++
            },
            parseUnknownError: () => {
               throw new Error('Some error')
            },
         }))

         await upfetch('', {
            onError() {
               count++
            },
         }).catch((error) => {
            expect(error.message).toEqual('Some error')
         })
         expect(count).toBe(3)
      })
   })

   describe('onBeforeFetch', () => {
      test('Should be called on upfetch, then on up', async () => {
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
            rest.get('https://example.com', (req, res, ctx) => {
               return res(ctx.json({ hello: 'world' }), ctx.status(200))
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
