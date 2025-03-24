import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { isResponseError, up } from '..'

const baseUrl = 'https://example.com'

const server = setupServer(
   http.get(`${baseUrl}/400`, async () => {
      return HttpResponse.json({ hello: 'world' }, { status: 400 })
   }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('reject', () => {
   test('should throw ResponseError by default when response.ok is false', async () => {
      let catchCount = 0

      const upfetch = up(fetch, (input) => ({
         baseUrl,
         retry: { attempts: 0 },
      }))

      await upfetch('/400').catch((error) => {
         expect(isResponseError(error)).toEqual(true)
         catchCount++
      })
      expect(catchCount).toEqual(1)
   })

   test('should not throw when reject returns false', async () => {
      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl,
         retry: { attempts: 0 },
         reject: () => false,
      }))

      await upfetch('/400').catch(() => {
         catchCount++
      })
      expect(catchCount).toEqual(0)
   })

   test('should execute reject before up.parseRejected', async () => {
      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl,
         retry: { attempts: 0 },
         reject: () => {
            expect(catchCount).toBe(0)
            catchCount++
            return true
         },
         parseRejected: async (e) => {
            expect(catchCount).toBe(1)
            catchCount++
            return e
         },
      }))

      await upfetch('/400').catch(() => {
         expect(catchCount).toBe(2)
         catchCount++
      })
      expect(catchCount).toEqual(3)
   })

   test('should execute reject before upfetch.parseRejected', async () => {
      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl,
         retry: { attempts: 0 },
         reject: () => {
            expect(catchCount).toBe(0)
            catchCount++
            return true
         },
      }))

      await upfetch('/400', {
         parseRejected: async (e) => {
            expect(catchCount).toBe(1)
            catchCount++
            return e
         },
      }).catch(() => {
         expect(catchCount).toBe(2)
         catchCount++
      })
      expect(catchCount).toEqual(3)
   })

   test('should support asynchronous reject functions', async () => {
      let catchCount = 0

      const upfetch = up(fetch, () => ({
         baseUrl,
         retry: { attempts: 0 },
         reject: async () => {
            return new Promise((resolve) => {
               catchCount++
               setTimeout(() => resolve(true), 100)
            })
         },
      }))

      await upfetch('/400', {
         parseRejected: async (e) => {
            expect(catchCount).toBe(1)
            catchCount++
            return e
         },
      }).catch(() => {
         expect(catchCount).toBe(2)
         catchCount++
      })
      expect(catchCount).toEqual(3)
   })
})
