import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { createFetcher } from './createFetcher.js'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { ResponseError } from './ResponseError.js'

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
            expect(error instanceof ResponseError).toBeTruthy()
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
         parseSuccess: (res) => res.json(),
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

   test('When fetch starts, onFetchStart(options, url) should be triggered', async () => {
      server.use(
         rest.post('https://example.com', (req, res, ctx) => {
            return res(ctx.status(200))
         }),
      )

      const upfetch = createFetcher(() => ({
         baseUrl: 'https://example.com',
         onFetchStart(options) {
            expect(options.baseUrl).toBe('https://example.com')
            expect(options.body).toBe('{"hello":"world"}')
            expect(options.method).toBe('POST')
            expect(options.href).toBe('https://example.com')
         },
      }))

      await upfetch({ body: { hello: 'world' }, method: 'POST' })
   })

   test('`parseError` default implementation  should return a ResponseError instance', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400), ctx.json({ some: 'json' }))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(error instanceof ResponseError).toEqual(true)
      })
   })

   test('`parseError` default implementation should parse JSON properly', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400), ctx.json({ some: 'json' }))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(error.response.data).toEqual({ some: 'json' })
      })
   })

   test('`parseError` default implementation should parse TEXT properly', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400), ctx.text('hello world'))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(error.response.data).toEqual('hello world')
      })
   })

   test('parseSuccess default implementation should parse JSON properly', async () => {
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

   test('parseSuccess default implementation should parse TEXT properly', async () => {
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
         rest.get('https://example.com/todos', (req, res, ctx) => {
            return res(ctx.status(200), ctx.text('hello world'))
         }),
      )

      const upfetch = createFetcher(() => ({
         onFetchStart(options) {
            options.baseUrl = 'https://example.com'
            options.url = '/todos'
         },
      }))

      await upfetch().then((res) => {
         expect(res).toBe('hello world')
      })
   })
})
