import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from '..'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

describe('onRequest', () => {
   test('should execute onRequest', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
         onRequest() {
            expect(exec).toBe(0)
            exec++
         },
      }))

      await upfetch('', {
         onRequest() {
            expect(exec).toBe(1)
            exec++
         },
      })
      expect(exec).toBe(2)
   })

   test('should provide request object to onRequest callback', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )
      let exec = 0
      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
         onRequest(request) {
            exec++
            expect(request.url).toBe('https://example.com/')
         },
      }))

      await upfetch('', {
         onRequest(request) {
            exec++
            expect(request.url).toBe('https://example.com/')
         },
      })
      expect(exec).toBe(2)
   })
})

test('should handle async onRequest callbacks in sequence', async () => {
   server.use(
      http.get(baseUrl, ({ request }) => {
         expect(request.headers.get('x-test-1')).toBe('test-1')
         expect(request.headers.get('x-test-2')).toBe('test-2')
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   const upfetch = up(fetch, () => ({
      baseUrl: baseUrl,
      retry: { attempts: 0 },
      async onRequest(request) {
         await new Promise((resolve) => setTimeout(resolve, 10))
         request.headers.set('x-test-1', 'test-1')
      },
   }))

   const data = await upfetch('', {
      async onRequest(request) {
         expect(request.headers.get('x-test-1')).toBe('test-1')
         await new Promise((resolve) => setTimeout(resolve, 5))
         request.headers.set('x-test-2', 'test-2')
      },
   })

   expect(data).toEqual({ hello: 'world' })
})
