import { afterEach } from 'node:test'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, expect, expectTypeOf, test, vi } from 'vitest'
import { withRetry } from './retry'

const server = setupServer()
beforeAll(() => {
   server.listen()
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

test('should call retryWhen with the response', async () => {
   const fetchWithRetry = withRetry(fetch)
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const spy = vi.fn()

   await fetchWithRetry(baseUrl, {
      retryWhen: (response) => {
         spy()
         expectTypeOf(response).toEqualTypeOf<Response>()
         expect(response instanceof Response).toBe(true)
         return false
      },
   })
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should not call retryTimes or retryDelay when retryWhen returns false', async () => {
   const fetchWithRetry = withRetry(fetch)
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const retryTimesSpy = vi.fn()
   const retryDelaySpy = vi.fn()

   await fetchWithRetry(baseUrl, {
      retryWhen: () => false,
      retryTimes: retryTimesSpy,
      retryDelay: retryDelaySpy,
   })
   expect(retryTimesSpy).not.toHaveBeenCalled()
   expect(retryDelaySpy).not.toHaveBeenCalled()
})

test('should call retryTimes with the response when retryWhen returns true', async () => {
   const fetchWithRetry = withRetry(fetch)
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const spy = vi.fn()

   await fetchWithRetry(baseUrl, {
      retryWhen: () => true,
      retryTimes(response) {
         spy()
         expectTypeOf(response).toEqualTypeOf<Response>()
         expect(response instanceof Response).toBe(true)
         return 0
      },
   })
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should not call retryDelay when retryTimes returns 0', async () => {
   const fetchWithRetry = withRetry(fetch)
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const spy = vi.fn()

   await fetchWithRetry(baseUrl, {
      retryWhen: () => true,
      retryTimes: () => 0,
      retryDelay: spy,
   })
   expect(spy).toHaveBeenCalledTimes(0)
})

test('should call retryDelay with the attempt number and response when retryWhen returns true and retryTimes returns more than 0', async () => {
   const fetchWithRetry = withRetry(fetch)
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const spy = vi.fn()

   await fetchWithRetry(baseUrl, {
      retryWhen: () => true,
      retryTimes: () => 1,
      retryDelay(attempt, response) {
         spy()
         expectTypeOf(attempt).toEqualTypeOf<number>()
         expect(typeof attempt).toBe('number')
         expectTypeOf(response).toEqualTypeOf<Response>()
         expect(response instanceof Response).toBe(true)
         return 0
      },
   })
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should retry `N = retryTimes()` times when retryWhen returns true', async () => {
   const fetchWithRetry = withRetry(fetch)
   const spy = vi.fn()

   server.use(
      http.get('http://example.com', async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await fetchWithRetry('http://example.com', {
      retryWhen: () => true,
      retryTimes: () => 1,
   })
   expect(spy).toHaveBeenCalledTimes(2)
})
