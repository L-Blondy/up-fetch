import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from '..'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

describe('parseResponse', () => {
   test('should parse JSON responses by default', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
      }))
      const data = await upfetch('')
      expect(data).toEqual({ hello: 'world' })
   })

   test('should parse TEXT responses by default', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.text('some text', { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
      }))
      const data = await upfetch('')
      expect(data).toEqual('some text')
   })

   test('should provide response and request to parseResponse function', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.text('some text', { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         parseResponse(res, request) {
            expect(res instanceof Response).toEqual(true)
            expect(request.url).toEqual('https://example.com/')
            return res.text()
         },
      }))
      await upfetch('')
   })

   test('should execute parseResponse before onSuccess callback', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.text('some text', { status: 200 })
         }),
      )

      let count = 1

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         parseResponse(res) {
            expect(count).toEqual(1)
            count++
            return res.text()
         },
         onSuccess() {
            expect(count).toEqual(2)
            count++
         },
      }))
      await upfetch('')
      expect(count).toEqual(3)
   })

   test('should also receive responses with empty body', async () => {
      server.use(
         http.get(baseUrl, () => {
            return new Response(null, { status: 200 })
         }),
      )

      let count = 1

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         parseResponse(res) {
            expect(res.body).toEqual(null)
            expect(count).toEqual(1)
            count++
            return res.text()
         },
      }))
      await upfetch('')
      expect(count).toEqual(2)
   })

   test('should allow upfetch.parseResponse to override up.parseResponse', async () => {
      server.use(
         http.post(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         parseResponse: () => Promise.resolve('from=up'),
      }))
      const data = await upfetch('', {
         body: { a: 1 },
         method: 'POST',
         parseResponse: () => Promise.resolve('from=upfetch'),
      })

      expect(data).toEqual('from=upfetch')
   })
})
