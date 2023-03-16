import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { createFetcher } from './createFetcher'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { ResponseError } from './ResponseError'

const fakeFetch = ((...args: Parameters<typeof fetch>) => {
   const returnedObject = {
      url: args[0],
      config: args[1],
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

describe('Config', () => {
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
         expect(final1.config.headers.get('content-type')).toBe('application/json')
         expect(final1.config.body).toBe('{"a":1}')

         const final2 = await fetchClient({
            body: [1],
         })
         expect(final2.config.headers.get('content-type')).toBe('application/json')
         expect(final2.config.body).toBe('[1]')

         const final3 = await fetchClient({
            body: '[1]',
         })
         expect(final3.config.headers.get('content-type')).toBe('application/json')
         expect(final3.config.body).toBe('[1]')
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
         expect(final1.config.headers.get('content-type')).toBe('text/html')
         expect(final1.config.body).toBe('{"a":1}')

         const final2 = await fetchClient({
            body: [1],
         })
         expect(final2.config.headers.get('content-type')).toBe('text/html')
         expect(final2.config.body).toBe('[1]')

         const final3 = await fetchClient({
            body: '[1]',
         })
         expect(final3.config.headers.get('content-type')).toBe('text/html')
         expect(final3.config.body).toBe('[1]')
      })
   })

   test('factoryConfig() should override the defaults', async () => {
      const serializeBody = () => '123'
      const serializeParams = () => '456'
      const parseSuccess = (s: any) => s.json()
      const parseError = (e: any) => e.text()

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
            parseError,
            parseSuccess,
         }),
         fakeFetch,
      )

      const final = await fetchClient({ params: {}, body: {} })
      expect(final.url).toBe('https://a.b.c?456')
      expect(final.config.body).toEqual('123')
      expect(final.config.cache).toEqual('force-cache')
      expect(final.config.credentials).toEqual('omit')
      expect(final.config.integrity).toEqual('123')
      expect(final.config.keepalive).toEqual(false)
      expect(final.config.mode).toEqual('same-origin')
      expect(final.config.redirect).toEqual('follow')
      expect(final.config.referrer).toEqual('me')
      expect(final.config.referrerPolicy).toEqual('origin-when-cross-origin')
      expect(final.config.headers.get('content-type')).toEqual('text/html')
      expect(final.config.method).toEqual('POST')
      expect(final.config.window).toEqual(null)
      expect(final.config.parseSuccess).toEqual(parseSuccess)
      expect(final.config.parseError).toEqual(parseError)
   })

   test('fetchConfig config should override factoryConfig()', async () => {
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
            parseSuccess: () => Promise.resolve(321),
            parseError: () => Promise.resolve(654),
            signal: 'factory signal' as any,
         }
      }, fakeFetch)

      const serializeBody = (x: any) => x
      const serializeParams = (x: any) => x
      const parseSuccess = (s: any) => s.json() as Promise<any>
      const parseError = (e: any) => e.text() as Promise<any>
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
         parseSuccess,
         parseError,
      })

      expect(final.url).toBe('https://1.2.3/4/5?a=a')
      expect(final.config.body).toEqual({ a: 1 })
      expect(final.config.cache).toEqual('no-store')
      expect(final.config.credentials).toEqual('include')
      expect(final.config.integrity).toEqual('456')
      expect(final.config.keepalive).toEqual(true)
      expect(final.config.mode).toEqual('navigate')
      expect(final.config.redirect).toEqual('error')
      expect(final.config.referrer).toEqual('you')
      expect(final.config.referrerPolicy).toEqual('origin')
      expect(final.config.headers.get('content-type')).toEqual('application/json')
      expect(final.config.method).toEqual('DELETE')
      expect(final.config.signal).toEqual(signal)
      expect(final.config.window).toEqual(null)
      expect(final.config.parseSuccess).toEqual(parseSuccess)
      expect(final.config.parseError).toEqual(parseError)
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
      expect(final.config.body).toEqual('test body')
   })

   test('An empty fetchClient baseUrl should override the defaults() baseUrl', async () => {
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
         parseSuccess: (res) => res.json(),
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

   test('When fetch starts, onFetchStart(config, url) should be triggered', async () => {
      server.use(
         rest.get('https://example.com', (req, res, ctx) => {
            return res(ctx.status(200))
         }),
      )

      const upfetch = createFetcher(() => ({
         baseUrl: 'https://example.com',
         onFetchStart(config, url) {
            console.log(config)
            //    expect(config.baseUrl).toBe('https://example.com')
            //    expect(config.body).toBe('{"hello":"world"}')
            //    expect(config.method).toBe('POST')
            //    expect(url).toBe('https://example.com')
         },
      }))

      await upfetch({ body: "{ hello: 'world' }", method: 'POST' })
   })
})
