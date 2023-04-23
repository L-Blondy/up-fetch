import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { createFetcher } from './createFetcher.js'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { isResponseError } from './ResponseError.js'

describe('createFetcher', () => {
   const server = setupServer()
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())

   test('Json responses should be parsed by default', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.json({ hello: 'world' }), ctx.status(200))
         }),
      )

      const upfetch = createFetcher(() => ({
         baseUrl: 'https://example.com',
      }))
      const data = await upfetch()
      expect(data).toEqual({ hello: 'world' })
   })

   test('Text responses should be parsed by default', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.text('some text'), ctx.status(200))
         }),
      )

      const upfetch = createFetcher(() => ({
         baseUrl: 'https://example.com',
      }))
      const data = await upfetch()
      expect(data).toEqual('some text')
   })

   test('When response is `ok`,`onSuccess` should be called after the data is parsed', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.json({ hello: 'world' }), ctx.status(200))
         }),
         rest.get('https://example.com/id', (req, res, ctx) => {
            return res(ctx.json({ id: 10 }), ctx.status(200))
         }),
      )

      let count = 1

      const upfetch = createFetcher(() => ({
         baseUrl: 'https://example.com',
         onSuccess(data) {
            if (count === 1) {
               expect(data).toEqual({ hello: 'world' })
               count++
               return
            }
            if (count === 2) {
               expect(data).toEqual({ id: 10 })
               count++
               return
            }
         },
      }))

      await upfetch()
      await upfetch({ url: '/id' })
   })

   test('When response is NOT `ok`, a ResponseError containing response and the requestOptions should be thrown. The ResponseError should be passed to onError', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.json({ hello: 'world' }), ctx.status(400))
         }),
         rest.get('https://example.com/id', (req, res, ctx) => {
            return res(ctx.text('hello error'), ctx.status(401))
         }),
      )

      let count = 1

      const upfetch = createFetcher(() => ({
         baseUrl: 'https://example.com',
         cache: 'default',
         credentials: 'omit',
         onError(error) {
            expect(isResponseError(error)).toBeTruthy()
            if (count === 1) {
               expect(error.message).toEqual('Request failed with status 400')
               expect(error.options.cache).toBe('default')
               expect(error.options.credentials).toBe('omit')
               expect(error.response.status).toEqual(400)
               expect(error.response.data).toEqual({ hello: 'world' })
               count++
               return
            }
            if (count === 2) {
               expect(error.message).toEqual('Request failed with status 401')
               expect(error.options.cache).toBe('default')
               expect(error.options.credentials).toBe('omit')
               expect(error.response.status).toEqual(401)
               expect(error.response.data).toEqual('hello error')
               count++
               return
            }
         },
      }))

      await upfetch().catch((error) => {
         // the same error as onError with count === 1
         expect(isResponseError(error)).toEqual(true)
         expect(error.message).toEqual('Request failed with status 400')
         expect(error.options.cache).toBe('default')
         expect(error.options.credentials).toBe('omit')
         expect(error.response.status).toEqual(400)
         expect(error.response.data).toEqual({ hello: 'world' })
         // catch the network request error & re-throw the assertion errors only
         if (error.name === 'AssertionError') {
            throw error
         }
      })
      await upfetch({ url: '/id' }).catch((error) => {
         // the same error as onError with count === 2
         expect(isResponseError(error)).toEqual(true)
         expect(error.message).toEqual('Request failed with status 401')
         expect(error.options.cache).toBe('default')
         expect(error.options.credentials).toBe('omit')
         expect(error.response.status).toEqual(401)
         expect(error.response.data).toEqual('hello error')
         // catch the network request error & re-throw the assertion errors only
         if (error.name === 'AssertionError') {
            throw error
         }
      })
   })

   test('Response Parsing errors should also be passed to onError', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.text('hello error'), ctx.status(200))
         }),
      )

      let count = 1

      const upfetch = createFetcher(() => ({
         baseUrl: 'https://example.com',
         parseResponse: (res) => res.json(),
         onError(error) {
            expect(error.name).toBe('SyntaxError')
            count++
         },
      }))

      await upfetch({
         cache: 'default',
      }).catch((error) => {
         if (error.name === 'AssertionError') {
            throw error
         }
      })
      // verifies that onError was called
      expect(count).toBe(2)
   })

   test('Other types of errors (e.g. invalid url) should also be passed to onError', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400))
         }),
      )

      let count = 1

      const upfetch = createFetcher(() => ({
         onError(error) {
            expect(error.name).toBe('TypeError')
            count++
         },
      }))

      await upfetch().catch((error) => {
         if (error.name === 'AssertionError') {
            throw error
         }
      })
      // verifies that onError was called
      expect(count).toBe(2)
   })

   test('When fetch starts, beforeFetch(options, url) should be triggered', async () => {
      server.use(
         rest.post('https://example.com', (req, res, ctx) => {
            return res(ctx.status(200))
         }),
      )

      const upfetch = createFetcher(() => ({
         baseUrl: 'https://example.com',
         beforeFetch(options) {
            expect(options.baseUrl).toBe('https://example.com')
            expect(options.body).toBe('{"hello":"world"}')
            expect(options.method).toBe('POST')
            expect(options.href).toBe('https://example.com')
         },
      }))

      await upfetch({ body: { hello: 'world' }, method: 'POST' })
   })

   test('`parseThrownResponse` default implementation  should return a ResponseError instance', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400), ctx.json({ some: 'json' }))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(isResponseError(error)).toEqual(true)
      })
   })

   test('`parseThrownResponse` default implementation should parse JSON properly', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400), ctx.json({ some: 'json' }))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(isResponseError(error)).toEqual(true)
         expect(error.response.data).toEqual({ some: 'json' })
      })
   })

   test('`parseThrownResponse` default implementation should parse TEXT properly', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400), ctx.text('hello world'))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(isResponseError(error)).toEqual(true)
         expect(error.response.data).toEqual('hello world')
      })
   })

   test('`parseThrownResponse` should parse the data as null when the server response contains no data', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(isResponseError(error)).toEqual(true)
         expect(error.response.data).toEqual(null)
      })
   })

   test('`parseResponse` should parse the data as null when the server response contains no data', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(200))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().then((data) => {
         expect(data).toEqual(null)
      })
   })

   test('parseResponse default implementation should parse JSON properly', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(200), ctx.json({ some: 'json' }))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().then((data) => {
         expect(data).toEqual({ some: 'json' })
      })
   })

   test('parseResponse default implementation should parse TEXT properly', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(200), ctx.text('hello world'))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().then((data) => {
         expect(data).toEqual('hello world')
      })
   })

   test('mutating the requestOptions should work properly', async () => {
      server.use(
         rest.post('https://example.com/todos', async (req, res, ctx) => {
            const body = await req.json()
            expect(req.headers.get('content-type')).toBe('application/json')
            expect(req.headers.get('Authorization')).toBe('Bearer token')
            expect(body).toEqual({ a: 2 })
            return res(ctx.status(200), ctx.text('hello world'))
         }),
      )

      const upfetch = createFetcher(() => ({
         headers: { 'content-type': 'application/json' },

         beforeFetch(options) {
            options.href = 'https://example.com/todos'
            options.method = 'POST'
            options.headers.append('Authorization', 'Bearer token')
            options.body = '{"a":2}'
         },
      }))

      await upfetch({ body: { a: 1 } }).then((res) => {
         expect(res).toBe('hello world')
      })
   })

   test('`serializeParams` should NOT be called if typeof `params` === string | undefined | null', async () => {
      server.use(
         rest.get('https://example.com', async (req, res, ctx) => {
            return res(ctx.status(200), ctx.json({ some: 'json' }))
         }),
      )

      await createFetcher()({
         url: 'https://example.com',
         params: undefined,
         serializeParams: () => {
            throw new Error('`serializeParams` should not have been called')
         },
      })
      await createFetcher()({
         url: 'https://example.com',
         params: null,
         serializeParams: () => {
            throw new Error('`serializeParams` should not have been called')
         },
      })
      await createFetcher()({
         url: 'https://example.com',
         params: 'string',
         serializeParams: () => {
            throw new Error('`serializeParams` should not have been called')
         },
      })
   })

   test('`serializeParams` should be called if typeof `params` === Record<string, any>', async () => {
      server.use(
         rest.get('https://example.com', async (req, res, ctx) => {
            expect(req.url.searchParams.get('hello')).toBe('world')
            return res(ctx.status(200), ctx.json({ some: 'json' }))
         }),
      )

      await createFetcher()({
         url: 'https://example.com',
         params: { hello: 'world' },
      })
   })

   test('Default params can be set in createFetcher', async () => {
      server.use(
         rest.get('https://example.com', async (req, res, ctx) => {
            expect(req.url.searchParams.get('hello')).toBe('world')
            return res(ctx.status(200), ctx.json({ some: 'json' }))
         }),
      )

      await createFetcher(() => ({
         baseUrl: 'https://example.com',
         params: { hello: 'world' },
      }))()
   })

   test.only('The default params and the request params should be shallowly merged', async () => {
      server.use(
         rest.get('https://example.com', async (req, res, ctx) => {
            expect(req.url.searchParams.get('a')).toBe('1')
            expect(req.url.searchParams.get('b')).toBe('10')
            expect(req.url.searchParams.get('c')).toBe('11')
            return res(ctx.status(200), ctx.json({ some: 'json' }))
         }),
      )

      await createFetcher(() => ({
         baseUrl: 'https://example.com',
         params: { a: 1, b: 2, c: 3 },
      }))({
         params: { b: 10, c: 11 },
      })
   })
})

describe('withRetry', () => {
   const server = setupServer()
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())

   test('Should not retry by default', async () => {
      let retryCount = -1
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            retryCount++
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await createFetcher(() => ({ baseUrl: 'https://example.com' }))().catch(() => {})
      expect(retryCount).toBe(0)
   })

   test('`{retryTimes: 1}` should retry once', async () => {
      let retryCount = -1
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            retryCount++
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await createFetcher(() => ({
         baseUrl: 'https://example.com',
         retryTimes: 1,
         retryDelay: () => 1,
      }))().catch(() => {})
      expect(retryCount).toBe(1)
   })

   test.each`
      status | expectedRetryCount
      ${408} | ${1}
      ${413} | ${1}
      ${429} | ${1}
      ${500} | ${1}
      ${502} | ${1}
      ${503} | ${1}
      ${504} | ${1}
      ${400} | ${0}
   `('By default, should retry for status $status', async ({ status, expectedRetryCount }) => {
      let retryCount = -1
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            retryCount++
            return res(ctx.text('hello error'), ctx.status(status))
         }),
      )

      await createFetcher(() => ({
         baseUrl: 'https://example.com',
         retryTimes: 1,
         retryDelay: () => 1,
      }))().catch(() => {})
      expect(retryCount).toBe(expectedRetryCount)
   })

   test.each`
      status | expectedRetryCount
      ${408} | ${0}
      ${413} | ${0}
      ${429} | ${0}
      ${500} | ${0}
      ${502} | ${0}
      ${503} | ${0}
      ${504} | ${0}
      ${482} | ${1}
   `(
      '`retryWhen` can be used to customize the "when to retry" logic',
      async ({ status, expectedRetryCount }) => {
         let retryCount = -1
         server.use(
            rest.get('https://example.com', (req, res, ctx) => {
               retryCount++
               return res(ctx.text('hello error'), ctx.status(status))
            }),
         )
         await createFetcher(() => ({
            baseUrl: 'https://example.com',
            retryTimes: 1,
            retryDelay: () => 1,
            retryWhen: (res: Response) => res.status === 482,
         }))().catch(() => {})
         expect(retryCount).toBe(expectedRetryCount)
      },
   )

   test('the default retry delay should be 2000ms for the first retry 3000ms for the second (attemptNumber * 1.5)', async () => {
      let retryCount = -1
      let startMs = Date.now()
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            retryCount++
            if (retryCount === 1) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(2000)
               expect(Date.now() - startMs).toBeLessThanOrEqual(2200)
               startMs = Date.now()
            }
            if (retryCount === 2) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(3000)
               expect(Date.now() - startMs).toBeLessThanOrEqual(3200)
               startMs = Date.now()
            }
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await createFetcher(() => ({
         baseUrl: 'https://example.com',
         retryTimes: 2,
      }))().catch(() => {})
      expect(retryCount).toBe(2)
   }, 10000)

   test('`retryDelay` should receive `attemptNumber` and `response` as arguments', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await createFetcher(() => ({
         baseUrl: 'https://example.com',
         retryTimes: 1,
         retryDelay: (attemptNumber, response) => {
            expect(attemptNumber).toBe(1)
            expect(response.status).toBe(408)
            return 0
         },
      }))().catch(() => {})
   }, 10000)

   test('the default retry delay can be customized with `retryDelay`', async () => {
      let retryCount = -1
      let startMs = Date.now()
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            retryCount++
            if (retryCount === 1) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(500)
               expect(Date.now() - startMs).toBeLessThanOrEqual(700)
               startMs = Date.now()
            }
            if (retryCount === 2) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(1000)
               expect(Date.now() - startMs).toBeLessThanOrEqual(1200)
               startMs = Date.now()
            }
            if (retryCount === 3) {
               expect(Date.now() - startMs).toBeGreaterThanOrEqual(1500)
               expect(Date.now() - startMs).toBeLessThanOrEqual(1700)
               startMs = Date.now()
            }

            return res(ctx.text('hello error'), ctx.status(408))
         }),
      )
      await createFetcher(() => ({
         baseUrl: 'https://example.com',
         retryTimes: 3,
         retryDelay: (attempt) => attempt * 500,
      }))().catch(() => {})
      expect(retryCount).toBe(3)
   }, 10000)

   test('status 200 after retry should resolve properly', async () => {
      let count = 0
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            if (count === 0) {
               count++
               return res(ctx.text('hello error'), ctx.status(408))
            }
            count++
            return res(ctx.text('hello success'), ctx.status(200))
         }),
      )
      const data = await createFetcher(() => ({
         baseUrl: 'https://example.com',
         retryTimes: 1,
         retryDelay: () => 1,
      }))().catch(() => {})
      expect(data).toBe('hello success')
      expect(count).toBe(2)
   })

   test('Retries should not be triggered by non ResponseError errors', async () => {
      const startAtMs = Date.now()
      const retryDelay = 1000

      await createFetcher(() => ({
         baseUrl: 'https://example.com',
         retryTimes: 1,
         retryDelay: () => retryDelay,
      }))().catch(() => {
         expect(Date.now() - startAtMs).toBeLessThan(retryDelay)
      })
   })
})
