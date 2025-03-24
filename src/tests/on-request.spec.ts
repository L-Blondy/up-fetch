import { http, HttpResponse } from 'msw'
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
