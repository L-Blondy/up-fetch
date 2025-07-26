import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
   afterAll,
   afterEach,
   beforeAll,
   describe,
   expect,
   expectTypeOf,
   test,
} from 'vitest'
import { z } from 'zod'
import {
   type ResponseError,
   type ValidationError,
   isResponseError,
   isValidationError,
   up,
} from '..'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

describe('onError', () => {
   test('should receive validation errors', async () => {
      server.use(
         http.get(baseUrl, async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )
      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         onError(error, request) {
            if (isValidationError(error)) {
               exec++
               expectTypeOf(error).toEqualTypeOf<ValidationError>()
            }
         },
      }))

      await upfetch('', {
         schema: z.object({ hello: z.number() }),
         onError(error, request) {
            if (isValidationError(error)) {
               exec++
               expectTypeOf(error).toEqualTypeOf<ValidationError>()
            }
         },
      }).catch(() => {})
      expect(exec).toBe(2)
   })

   test('should receive the response errors', async () => {
      server.use(
         http.get(baseUrl, async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 400 })
         }),
      )
      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         retry: { attempts: 0 },
         onError(error, request) {
            if (isResponseError(error)) {
               exec++
               expectTypeOf(error).toEqualTypeOf<ResponseError>()
            }
         },
      }))

      await upfetch('', {
         onError(error, request) {
            if (isResponseError(error)) {
               exec++
               expectTypeOf(error).toEqualTypeOf<ResponseError>()
            }
         },
      }).catch(() => {})
      expect(exec).toBe(2)
   })

   test('should receive any error', async () => {
      server.use(
         http.get(baseUrl, async () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         onError(error, request) {
            exec++
            expectTypeOf(error).toEqualTypeOf<unknown>()
         },
      }))

      await upfetch('', {
         parseResponse: () => {
            throw new Error('unknown error')
         },
         onError(error, request) {
            exec++
            expectTypeOf(error).toEqualTypeOf<unknown>()
         },
      }).catch(() => {})
      expect(exec).toBe(2)
   })
})
