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
})
