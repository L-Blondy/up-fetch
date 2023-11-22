import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from './up.js'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { isResponseError } from './response-error.js'

describe('up', () => {
   const server = setupServer()
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())

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

      test.only('If parseUnknownError throws, onUnknownError & onError should still be called', async () => {
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

   // test('When response is `ok`,`parseResponse`, then `onSuccess` should be called', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.json({ hello: 'world' }), ctx.status(200))
   //       }),
   //       rest.get('https://example.com/id', (req, res, ctx) => {
   //          return res(ctx.json({ id: 10 }), ctx.status(200))
   //       }),
   //    )

   //    let count = 1

   //    const upfetch = up(fetch, () => ({
   //       baseUrl: 'https://example.com',
   //       parseResponse(res) {
   //          expect([1, 3]).toContain(count)
   //          count++
   //          return res.json()
   //       },
   //       onSuccess(data) {
   //          expect([2, 4]).toContain(count)
   //          if (count === 2) {
   //             expect(data).toEqual({ hello: 'world' })
   //             return
   //          }
   //          if (count === 4) {
   //             expect(data).toEqual({ id: 10 })
   //             return
   //          }
   //       },
   //    }))

   //    await upfetch('', {
   //       onSuccess(data) {
   //          expect(data).toEqual({ hello: 'world' })
   //       },
   //    })
   //    count++
   //    await upfetch('/id', {
   //       onSuccess(data) {
   //          expect(data).toEqual({ id: 10 })
   //       },
   //    })
   // })

   // test('When response is NOT `ok`, a ResponseError containing response and the requestOptions should be thrown. The ResponseError should be passed to onError & onResponseError', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.json({ hello: 'world' }), ctx.status(400))
   //       }),
   //       rest.get('https://example.com/id', (req, res, ctx) => {
   //          return res(ctx.text('hello error'), ctx.status(401))
   //       }),
   //    )

   //    let count = 1

   //    const upfetch = up(fetch, () => ({
   //       baseUrl: 'https://example.com',
   //       cache: 'default',
   //       credentials: 'omit',
   //       onError(error) {
   //          expect(isResponseError(error)).toBeTruthy()
   //          if (count === 1) {
   //             expect(error.message).toEqual('Request failed with status 400')
   //             expect(error.options.cache).toBe('default')
   //             expect(error.options.credentials).toBe('omit')
   //             expect(error.response.status).toEqual(400)
   //             expect(error.data).toEqual({ hello: 'world' })
   //             return
   //          }
   //          if (count === 2) {
   //             expect(error.message).toEqual('Request failed with status 401')
   //             expect(error.options.cache).toBe('default')
   //             expect(error.options.credentials).toBe('omit')
   //             expect(error.response.status).toEqual(401)
   //             expect(error.data).toEqual('hello error')
   //             return
   //          }
   //       },
   //       onResponseError(error) {
   //          expect(isResponseError(error)).toBeTruthy()
   //          if (count === 1) {
   //             expect(error.message).toEqual('Request failed with status 400')
   //             expect(error.options.cache).toBe('default')
   //             expect(error.options.credentials).toBe('omit')
   //             expect(error.response.status).toEqual(400)
   //             expect(error.data).toEqual({ hello: 'world' })
   //             return
   //          }
   //          if (count === 2) {
   //             expect(error.message).toEqual('Request failed with status 401')
   //             expect(error.options.cache).toBe('default')
   //             expect(error.options.credentials).toBe('omit')
   //             expect(error.response.status).toEqual(401)
   //             expect(error.data).toEqual('hello error')
   //             return
   //          }
   //       },
   //    }))

   //    await upfetch('', {
   //       onError(error) {
   //          expect(isResponseError(error)).toEqual(true)
   //          expect(error.message).toEqual('Request failed with status 400')
   //          expect(error.options.cache).toBe('default')
   //          expect(error.options.credentials).toBe('omit')
   //          expect(error.response.status).toEqual(400)
   //          expect(error.data).toEqual({ hello: 'world' })
   //          // catch the network request error & re-throw the assertion errors only
   //          if (error.name === 'AssertionError') {
   //             throw error
   //          }
   //       },
   //    })
   //    count++
   //    await upfetch('/id', {
   //       onError(error) {
   //          // the same error as onError with count === 2
   //          expect(isResponseError(error)).toEqual(true)
   //          expect(error.message).toEqual('Request failed with status 401')
   //          expect(error.options.cache).toBe('default')
   //          expect(error.options.credentials).toBe('omit')
   //          expect(error.response.status).toEqual(401)
   //          expect(error.data).toEqual('hello error')
   //          // catch the network request error & re-throw the assertion errors only
   //          if (error.name === 'AssertionError') {
   //             throw error
   //          }
   //       },
   //    })
   // })

   // test('Response Parsing errors should also be passed to onError', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.text('hello error'), ctx.status(200))
   //       }),
   //    )

   //    let count = 1

   //    const upfetch = up(fetch, () => ({
   //       baseUrl: 'https://example.com',
   //       parseResponse: (res) => res.json(),
   //       onError(error) {
   //          expect(error.name).toBe('SyntaxError')
   //          count++
   //       },
   //    }))

   //    await upfetch('', {
   //       cache: 'default',
   //    }).catch((error) => {
   //       if (error.name === 'AssertionError') {
   //          throw error
   //       }
   //    })
   //    // verifies that onError was called
   //    expect(count).toBe(2)
   // })

   // test('Other types of errors (e.g. invalid url) should also be passed to onError', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(400))
   //       }),
   //    )

   //    let count = 1

   //    const upfetch = up(fetch, () => ({
   //       onError(error) {
   //          expect(error.name).toBe('TypeError')
   //          count++
   //       },
   //    }))

   //    await upfetch('').catch((error) => {
   //       if (error.name === 'AssertionError') {
   //          throw error
   //       }
   //    })
   //    // verifies that onError was called
   //    expect(count).toBe(2)
   // })

   // test('When fetch starts, beforeFetch(options, url) should be triggered', async () => {
   //    server.use(
   //       rest.post('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(200))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({
   //       baseUrl: 'https://example.com',
   //       beforeFetch(options) {
   //          expect(options.baseUrl).toBe('https://example.com')
   //          expect(options.body).toBe('{"hello":"world"}')
   //          expect(options.method).toBe('POST')
   //          expect(options.input).toBe('https://example.com')
   //       },
   //    }))

   //    await upfetch('', { body: { hello: 'world' }, method: 'POST' })
   // })

   // test('`parseThrownResponse` default implementation  should return a ResponseError instance', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(400), ctx.json({ some: 'json' }))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

   //    await upfetch('').catch((error) => {
   //       expect(isResponseError(error)).toEqual(true)
   //    })
   // })

   // test('`parseThrownResponse` default implementation should parse JSON properly', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(400), ctx.json({ some: 'json' }))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

   //    await upfetch('').catch((error) => {
   //       expect(isResponseError(error)).toEqual(true)
   //       expect(error.response.data).toEqual({ some: 'json' })
   //    })
   // })

   // test('`parseThrownResponse` default implementation should parse TEXT properly', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(400), ctx.text('hello world'))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

   //    await upfetch('').catch((error) => {
   //       expect(isResponseError(error)).toEqual(true)
   //       expect(error.response.data).toEqual('hello world')
   //    })
   // })

   // test('`parseThrownResponse` should parse the data as null when the server response contains no data', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(400))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

   //    await upfetch('').catch((error) => {
   //       expect(isResponseError(error)).toEqual(true)
   //       expect(error.response.data).toEqual(null)
   //    })
   // })

   // test('`parseResponse` should parse the data as null when the server response contains no data', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(200))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

   //    await upfetch('').then((data) => {
   //       expect(data).toEqual(null)
   //    })
   // })

   // test('parseResponse default implementation should parse JSON properly', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(200), ctx.json({ some: 'json' }))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

   //    await upfetch('').then((data) => {
   //       expect(data).toEqual({ some: 'json' })
   //    })
   // })

   // test('parseResponse default implementation should parse TEXT properly', async () => {
   //    server.use(
   //       rest.get('https://example.com', (req, res, ctx) => {
   //          return res(ctx.status(200), ctx.text('hello world'))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({ baseUrl: 'https://example.com' }))

   //    await upfetch('').then((data) => {
   //       expect(data).toEqual('hello world')
   //    })
   // })

   // test('mutating the requestOptions should work properly', async () => {
   //    server.use(
   //       rest.post('https://example.com/todos', async (req, res, ctx) => {
   //          const body = await req.json()
   //          expect(req.url.searchParams.get('a')).toBe('1')
   //          expect(req.headers.get('content-type')).toBe('application/json')
   //          expect(req.headers.get('Authorization')).toBe('Bearer token')
   //          expect(body).toEqual({ a: 2 })
   //          return res(ctx.status(200), ctx.text('hello world'))
   //       }),
   //    )

   //    const upfetch = up(fetch, () => ({
   //       headers: { 'content-type': 'application/json' },

   //       beforeFetch(options) {
   //          options.baseUrl = 'https://example.com'
   //          options.params = { a: 1 }
   //          options.method = 'POST'
   //          options.headers.Authorization = 'Bearer token'
   //          options.rawBody = '{"a":2}'
   //       },
   //    }))

   //    await upfetch('', { body: { a: 1 } }).then((res) => {
   //       expect(res).toBe('hello world')
   //    })
   // })

   // test('`serializeParams` should be called if typeof `params` === Record<string, any>', async () => {
   //    server.use(
   //       rest.get('https://example.com', async (req, res, ctx) => {
   //          expect(req.url.searchParams.get('hello')).toBe('world')
   //          return res(ctx.status(200), ctx.json({ some: 'json' }))
   //       }),
   //    )

   //    await up(fetch)('https://example.com', {
   //       params: { hello: 'world' },
   //    })
   // })

   // test('Default params can be set in up', async () => {
   //    server.use(
   //       rest.get('https://example.com', async (req, res, ctx) => {
   //          expect(req.url.searchParams.get('hello')).toBe('world')
   //          return res(ctx.status(200), ctx.json({ some: 'json' }))
   //       }),
   //    )

   //    await up(fetch, () => ({
   //       baseUrl: 'https://example.com',
   //       params: { hello: 'world' },
   //    }))('')
   // })

   // test('The default params and the request params should be shallowly merged', async () => {
   //    server.use(
   //       rest.get('https://example.com', async (req, res, ctx) => {
   //          expect(req.url.searchParams.get('a')).toBe('1')
   //          expect(req.url.searchParams.get('b')).toBe('10')
   //          expect(req.url.searchParams.get('c')).toBe('11')
   //          return res(ctx.status(200), ctx.json({ some: 'json' }))
   //       }),
   //    )

   //    await up(fetch, () => ({
   //       baseUrl: 'https://example.com',
   //       params: { a: 1, b: 2, c: 3 },
   //    }))('', {
   //       params: { b: 10, c: 11 },
   //    })
   // })
})
