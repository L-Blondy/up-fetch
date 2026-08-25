import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from '..'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

describe('onResponse', () => {
   test('should execute onResponse before parseResponse', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
         onResponse() {
            expect(exec).toBe(0)
            exec++
         },
      }))

      await upfetch('', {
         onResponse() {
            expect(exec).toBe(1)
            exec++
         },
         parseResponse(response) {
            expect(exec).toBe(2)
            exec++
            return response.json()
         },
      })
      expect(exec).toBe(3)
   })

   test('should execute once after all retries', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )
      let exec = 0
      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 3, when: () => true },
         onResponse(response) {
            expect(exec).toBe(0)
            exec++
         },
      }))

      await upfetch('', {
         onResponse(response) {
            expect(exec).toBe(1)
            exec++
         },
      })
      expect(exec).toBe(2)
   })

   // https://github.com/L-Blondy/up-fetch/issues/88
   test('should not execute when the fetch itself fails (no response)', async () => {
      let exec = 0

      const upfetch = up(fetch, () => ({
         retry: { attempts: 0 },
         onResponse() {
            exec++
         },
      }))

      await expect(
         // nothing listens on this port, fetch rejects (ECONNREFUSED)
         upfetch('http://127.0.0.1:59999', {
            onResponse() {
               exec++
            },
         }),
      ).rejects.toThrow()
      expect(exec).toBe(0)
   })

   // https://github.com/L-Blondy/up-fetch/issues/88
   test('should not execute when the last retry attempt fails without a response', async () => {
      let call = 0
      server.use(
         http.get(baseUrl, () => {
            return ++call === 1
               ? HttpResponse.json({}, { status: 500 })
               : HttpResponse.error()
         }),
      )
      let exec = 0
      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 1 },
         onResponse() {
            exec++
         },
      }))

      await expect(
         upfetch('', {
            onResponse() {
               exec++
            },
         }),
      ).rejects.toThrow()
      expect(call).toBe(2)
      expect(exec).toBe(0)
   })
})
