import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from '..'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

describe('parseRejected', () => {
   test('should parse JSON error responses by default', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
      }))
      await upfetch('').catch((error) => {
         expect(error.data).toEqual({ hello: 'world' })
      })
   })

   test('should parse TEXT error responses by default', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.text('some text', { status: 400 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
      }))
      await upfetch('').catch((error) => {
         expect(error.data).toEqual('some text')
      })
   })

   test('should provide response and request to parseRejected', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.text('some text', { status: 400 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
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
         http.get(baseUrl, () => {
            return HttpResponse.text('some text', { status: 400 })
         }),
      )

      let count = 1

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
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
         http.get(baseUrl, () => {
            return new Response(null, { status: 300 })
         }),
      )

      let count = 1

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
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
         http.post(baseUrl, async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
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
