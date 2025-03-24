import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { object, pipe, string, transform } from 'valibot'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from '..'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

describe('onSuccess', () => {
   test('should execute onSuccess when no error occurs', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         onSuccess() {
            expect(exec).toBe(0)
            exec++
         },
      }))

      await upfetch('', {
         onSuccess() {
            expect(exec).toBe(1)
            exec++
         },
      })
      expect(exec).toBe(2)
   })

   test('should provide validated data and request to onSuccess callback', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )
      let exec = 0
      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         onSuccess(data, request) {
            exec++
            expect(data).toEqual({ hello: 'world!' })
            expect(request.url).toEqual('https://example.com/')
         },
      }))

      await upfetch('', {
         schema: object({
            hello: pipe(
               string(),
               transform((v) => (v += '!')),
            ),
         }),
         onSuccess(data, request) {
            exec++
            expect(data).toEqual({ hello: 'world!' })
            expect(request.url).toEqual('https://example.com/')
         },
      })
      expect(exec).toBe(2)
   })

   test('should skip onSuccess when parseResponse throws an error', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         onSuccess() {
            exec++
            throw new Error('onSuccess should not be called')
         },
         parseResponse: () => {
            throw new Error('Some error')
         },
      }))

      await upfetch('', {
         onSuccess() {
            exec++
            throw new Error('onSuccess should not be called')
         },
      }).catch((error) => {
         expect(error.message).toEqual('Some error')
      })
      expect(exec).toBe(0)
   })
})
