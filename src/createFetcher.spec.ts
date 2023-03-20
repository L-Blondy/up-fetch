import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { createFetcher } from './createFetcher.js'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { ResponseError } from './ResponseError.js'

const fakeFetch = ((...args: Parameters<typeof fetch>) => {
   const returnedObject = {
      url: args[0],
      options: args[1],
      catch: () => ({ ...returnedObject }),
   }
   return Promise.resolve({
      ok: true,
      clone: () => ({
         json: () => ({ ...returnedObject }),
         text: () => '',
      }),
      json: () => ({ ...returnedObject }),
      text: () => '',
   })
}) as any

describe('Options', () => {
   describe('Automatic "content-type: application/json"', async () => {
      test('Should be applied when no "content-type" header is present', async () => {
         const fetchClient = createFetcher(() => {
            return {
               baseUrl: 'https://a.b.c',
               method: 'POST',
            }
         }, fakeFetch)

         const final1 = await fetchClient({
            body: { a: 1 },
         })
         expect(final1.options.headers.get('content-type')).toBe('application/json')
         expect(final1.options.body).toBe('{"a":1}')

         const final2 = await fetchClient({
            body: [1],
         })
         expect(final2.options.headers.get('content-type')).toBe('application/json')
         expect(final2.options.body).toBe('[1]')

         const final3 = await fetchClient({
            body: '[1]',
         })
         expect(final3.options.headers.get('content-type')).toBe('application/json')
         expect(final3.options.body).toBe('[1]')
      })

      test('Should not be applied when the "content-type" header is present', async () => {
         const fetchClient = createFetcher(() => {
            return {
               baseUrl: 'https://a.b.c',
               method: 'POST',
               headers: {
                  'content-type': 'text/html',
               },
            }
         }, fakeFetch)

         const final1 = await fetchClient({
            body: { a: 1 },
         })
         expect(final1.options.headers.get('content-type')).toBe('text/html')
         expect(final1.options.body).toBe('{"a":1}')

         const final2 = await fetchClient({
            body: [1],
         })
         expect(final2.options.headers.get('content-type')).toBe('text/html')
         expect(final2.options.body).toBe('[1]')

         const final3 = await fetchClient({
            body: '[1]',
         })
         expect(final3.options.headers.get('content-type')).toBe('text/html')
         expect(final3.options.body).toBe('[1]')
      })
   })

   test('defaultOptions() should override the fallbackOptions', async () => {
      const serializeBody = () => '123'
      const serializeParams = () => '456'
      const parseResponseOk = (s: any) => s.json()

      const fetchClient = createFetcher(
         () => ({
            baseUrl: 'https://a.b.c',
            method: 'POST',
            headers: {
               'content-type': 'text/html',
            },
            cache: 'force-cache',
            credentials: 'omit',
            integrity: '123',
            keepalive: false,
            mode: 'same-origin',
            redirect: 'follow',
            referrer: 'me',
            referrerPolicy: 'origin-when-cross-origin',
            serializeBody,
            serializeParams,
            window: null,
            parseResponseOk,
         }),
         fakeFetch,
      )

      const final = await fetchClient({ params: {}, body: {} })
      expect(final.url).toBe('https://a.b.c?456')
      expect(final.options.body).toEqual('123')
      expect(final.options.cache).toEqual('force-cache')
      expect(final.options.credentials).toEqual('omit')
      expect(final.options.integrity).toEqual('123')
      expect(final.options.keepalive).toEqual(false)
      expect(final.options.mode).toEqual('same-origin')
      expect(final.options.redirect).toEqual('follow')
      expect(final.options.referrer).toEqual('me')
      expect(final.options.referrerPolicy).toEqual('origin-when-cross-origin')
      expect(final.options.headers.get('content-type')).toEqual('text/html')
      expect(final.options.method).toEqual('POST')
      expect(final.options.window).toEqual(null)
      expect(final.options.parseResponseOk).toEqual(parseResponseOk)
   })

   test('fetchOptions options should override defaultOptions()', async () => {
      const fetchClient = createFetcher(() => {
         return {
            baseUrl: 'https://a.b.c',
            method: 'POST',
            headers: {
               'content-type': 'text/html',
            },
            cache: 'force-cache',
            credentials: 'omit',
            integrity: '123',
            keepalive: false,
            mode: 'same-origin',
            redirect: 'follow',
            referrer: 'me',
            referrerPolicy: 'origin-when-cross-origin',
            serializeBody: () => '123',
            serializeParams: () => '456',
            window: undefined,
            parseResponseOk: () => Promise.resolve(321),
            signal: 'default signal' as any,
         }
      }, fakeFetch)

      const serializeBody = (x: any) => x
      const serializeParams = (x: any) => x
      const parseResponseOk = (s: any) => s.json() as Promise<any>
      const signal = 'upfetch signal' as any

      const final = await fetchClient({
         baseUrl: 'https://1.2.3',
         body: { a: 1 },
         cache: 'no-store',
         credentials: 'include',
         integrity: '456',
         keepalive: true,
         mode: 'navigate',
         redirect: 'error',
         referrer: 'you',
         referrerPolicy: 'origin',
         headers: {
            'content-type': 'application/json',
         },
         method: 'DELETE',
         params: 'a=a',
         serializeBody,
         serializeParams,
         signal,
         url: '4/5',
         window: null,
         parseResponseOk,
      })

      expect(final.url).toBe('https://1.2.3/4/5?a=a')
      expect(final.options.body).toEqual({ a: 1 })
      expect(final.options.cache).toEqual('no-store')
      expect(final.options.credentials).toEqual('include')
      expect(final.options.integrity).toEqual('456')
      expect(final.options.keepalive).toEqual(true)
      expect(final.options.mode).toEqual('navigate')
      expect(final.options.redirect).toEqual('error')
      expect(final.options.referrer).toEqual('you')
      expect(final.options.referrerPolicy).toEqual('origin')
      expect(final.options.headers.get('content-type')).toEqual('application/json')
      expect(final.options.method).toEqual('DELETE')
      expect(final.options.signal).toEqual(signal)
      expect(final.options.window).toEqual(null)
      expect(final.options.parseResponseOk).toEqual(parseResponseOk)
   })

   test('If params is a string, serializeParams should do nothing', async () => {
      const fetchClient = createFetcher(() => {
         return {
            baseUrl: 'https://a.b.c',
            serializeParams: () => '456',
         }
      }, fakeFetch)

      const final = await fetchClient({
         params: 'd=e',
      })
      expect(final.url).toEqual('https://a.b.c?d=e')
   })

   test('If body is a string, serializeBody should do nothing', async () => {
      const fetchClient = createFetcher(() => {
         return {
            baseUrl: 'https://a.b.c',
            method: 'POST',
            serializeBody: () => '456',
         }
      }, fakeFetch)

      const final = await fetchClient({
         body: 'test body',
      })
      expect(final.options.body).toEqual('test body')
   })

   test('An empty fetchClient baseUrl should override the fallbackOptions().baseUrl', async () => {
      const fetchClient = createFetcher(() => {
         return { baseUrl: 'https://a.b.c/' }
      }, fakeFetch)

      const final = await fetchClient({
         baseUrl: '',
         url: '/a',
      })
      expect(final.url).toBe('/a')
   })
})

describe('tests with server', () => {
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

   test('response.ok, onSuccess should be called after the data is parsed', async () => {
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

   test('!response.ok, a ResponseError containing the parsed data (text or json) should be triggered, the Response Error should be passed to onError', async () => {
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
         onError(error: ResponseError) {
            expect(error instanceof ResponseError).toBeTruthy()
            if (count === 1) {
               expect(error.status).toEqual(400)
               expect(error.message).toEqual('Request failed with status 400')
               expect(error.data).toEqual({ hello: 'world' })
               count++
               return
            }
            if (count === 2) {
               expect(error.status).toEqual(401)
               expect(error.message).toEqual('Request failed with status 401')
               expect(error.data).toEqual('hello error')
               count++
               return
            }
         },
      }))

      await upfetch().catch((error) => {
         // the same error as onError with count === 1
         expect(error.status).toEqual(400)
         expect(error.message).toEqual('Request failed with status 400')
         expect(error.data).toEqual({ hello: 'world' })
         // catch the network request error & re-throw the assertion errors only
         if (error.name === 'AssertionError') {
            throw error
         }
      })
      await upfetch({ url: '/id' }).catch((error) => {
         // the same error as onError with count === 2
         expect(error.status).toEqual(401)
         expect(error.message).toEqual('Request failed with status 401')
         expect(error.data).toEqual('hello error')
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
         parseResponseOk: (res) => res.json(),
         onError(error) {
            expect(error.name).toBe('SyntaxError')
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

   test('`parseError` should return a ResponseError instance', async () => {
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

   test('`parseError` should parse JSON properly', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400), ctx.json({ some: 'json' }))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(error.data).toEqual({ some: 'json' })
      })
   })

   test('`parseError` should parse TEXT properly', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(400), ctx.text('hello world'))
         }),
      )

      const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com' }))

      await upfetch().catch((error) => {
         expect(error.data).toEqual('hello world')
      })
   })

   test('parseResponseOk default implementation should parse JSON properly', async () => {
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

   test('parseResponseOk default implementation should parse TEXT properly', async () => {
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
})
