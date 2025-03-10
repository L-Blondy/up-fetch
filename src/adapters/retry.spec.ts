import { afterEach } from 'node:test'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { up } from 'src/up'
import { afterAll, beforeAll, expect, expectTypeOf, test, vi } from 'vitest'
import { withRetry } from './retry'

const server = setupServer()
beforeAll(() => {
   server.listen()
})
afterEach(() => {
   server.resetHandlers()
})
afterAll(() => {
   server.close()
})

const baseUrl = 'https://example.com'

test('should call retry.when with the response', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: (response) => {
            spy()
            expectTypeOf(response).toEqualTypeOf<Response>()
            expect(response instanceof Response).toBe(true)
            return false
         },
      },
   }))
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const spy = vi.fn()

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should not call times or retry.delay when retry.when returns false', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => false,
         times: timesSpy,
         delay: delaySpy,
      },
   }))
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const timesSpy = vi.fn()
   const delaySpy = vi.fn()

   await upfetch('/')
   expect(timesSpy).not.toHaveBeenCalled()
   expect(delaySpy).not.toHaveBeenCalled()
})

test('should call retry.times with the response when retry.when returns true', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times(response) {
            spy()
            expectTypeOf(response).toEqualTypeOf<Response>()
            expect(response instanceof Response).toBe(true)
            return 0
         },
      },
   }))

   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const spy = vi.fn()

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should not call retry.delay when retry.times returns 0', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: () => 0,
         delay: spy,
      },
   }))
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const spy = vi.fn()

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(0)
})

test('should call retry.delay with the attempt number and response when retry.when returns true and retry.times returns more than 0', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: () => 1,
         delay(attempt, response) {
            spy()
            expectTypeOf(attempt).toEqualTypeOf<number>()
            expect(attempt).toBe(1)
            expectTypeOf(response).toEqualTypeOf<Response>()
            expect(response instanceof Response).toBe(true)
            return 0
         },
      },
   }))
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const spy = vi.fn()

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should retry `N = retry.times()` times when retry.when returns true', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: () => 1,
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(2)
})

test('should call retry.when, then times then retry.delay', async () => {
   let exec = 0
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => {
            expect(++exec).toBe(1)
            return true
         },
         times: () => {
            expect(++exec).toBe(2)
            return 1
         },
         delay: () => {
            expect(++exec).toBe(3)
            return 0
         },
      },
   }))

   server.use(
      http.get(baseUrl, async () => {
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await upfetch('/', {
      retry: { when: () => false },
   })
})

test('should allow upfetch.retry.when to override up.retry.when', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: 1,
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await upfetch('/', {
      retry: { when: () => false },
   })
   // no retry
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should allow upfetch.times to override up.times', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: 1,
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await upfetch('/', {
      retry: { times: 2 },
   })
   // no retry
   expect(spy).toHaveBeenCalledTimes(3)
})

test('should allow upfetch.retry.delay to override up.retry.delay', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: 1,
         delay: 2000,
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   const start = Date.now()
   await upfetch('/', {
      retry: { delay: 100 },
   })
   const duration = Date.now() - start
   expect(duration).toBeGreaterThanOrEqual(100)
   expect(duration).toBeLessThanOrEqual(110)
})

test('should handle defaultRetry.when for all specified status codes', async () => {
   const statusCodes = [408, 409, 425, 429, 500, 502, 503, 504]
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false, // Don't throw on error responses
      retry: { times: 1 },
   }))

   for (const status of statusCodes) {
      const spy = vi.fn()
      server.use(
         http.get(baseUrl, async () => {
            spy()
            return HttpResponse.json({ error: 'test' }, { status })
         }),
      )
      await upfetch('/')
      expect(spy).toHaveBeenCalledTimes(2) // Initial request + 1 retry
   }
})

test('should not retry for non-retryable HTTP methods', async () => {
   const nonRetryableMethods = ['POST', 'PATCH']
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false, // Don't throw on error responses
      retry: { times: 1 },
   }))

   for (const method of nonRetryableMethods) {
      const spy = vi.fn()
      server.use(
         http[method.toLowerCase() as 'post' | 'patch'](baseUrl, async () => {
            spy()
            return HttpResponse.json({ error: 'test' }, { status: 500 })
         }),
      )
      await upfetch('/', { method })
      expect(spy).toHaveBeenCalledTimes(1) // No retry for non-retryable methods
   }
})

test('should handle errors during times function execution', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: () => {
            throw new Error('times error')
         },
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   await expect(upfetch('/')).rejects.toThrow('times error')
   expect(spy).toHaveBeenCalledTimes(1) // Only initial request, no retries due to error
})

test('should handle errors during retry.delay function execution', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: 1,
         delay: () => {
            throw new Error('delay error')
         },
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   await expect(upfetch('/')).rejects.toThrow('delay error')
   expect(spy).toHaveBeenCalledTimes(1) // Only initial request, no retries due to error
})

test('should not retry when request times out', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      timeout: 100, // Set a short timeout
      retry: {
         when: () => true,
         times: 2,
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         await new Promise((resolve) => setTimeout(resolve, 200)) // Delay longer than timeout
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await expect(upfetch('/')).rejects.toThrow(
      'The operation was aborted due to timeout',
   )
   expect(spy).toHaveBeenCalledTimes(1) // Only initial request, no retries due to timeout
})

test('should not retry when request is aborted', async () => {
   const controller = new AbortController()
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retry: {
         when: () => true,
         times: 2,
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         await new Promise((resolve) => setTimeout(resolve, 100)) // Add delay to ensure we can abort
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   const promise = upfetch('/', { signal: controller.signal })
   controller.abort()

   await expect(promise).rejects.toThrow('This operation was aborted')
   expect(spy).toHaveBeenCalledTimes(1) // Only initial request, no retries due to abort
})

test('should not call onRetry when no retry is needed', async () => {
   const onRetrySpy = vi.fn()
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      onRetry: onRetrySpy,
      retry: {
         when: () => false,
      },
   }))

   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )

   await upfetch('/')
   expect(onRetrySpy).not.toHaveBeenCalled()
})

test('should call onRetry before each retry attempt', async () => {
   const onRetrySpy = vi.fn()
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      onRetry: onRetrySpy,
      retry: {
         when: () => true,
         times: 2,
         delay: 0,
      },
   }))

   server.use(http.get(baseUrl, () => HttpResponse.json({}, { status: 200 })))

   await upfetch('/')
   expect(onRetrySpy).toHaveBeenCalledTimes(2)
   expect(onRetrySpy).toHaveBeenNthCalledWith(
      1,
      1,
      expect.any(HttpResponse),
      expect.any(Request),
   )
   expect(onRetrySpy).toHaveBeenNthCalledWith(
      2,
      2,
      expect.any(HttpResponse),
      expect.any(Request),
   )
})

test('should execute both up.onRetry and upfetch.onRetry', async () => {
   const defaultSpy = vi.fn()
   const fetcherSpy = vi.fn()

   let exec = 0

   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      onRetry(...args) {
         expect(++exec).toBe(1)
         defaultSpy(...args)
      },
      reject: () => false,
      retry: {
         when: () => true,
         times: 1,
         delay: 0,
      },
   }))

   server.use(http.get(baseUrl, () => HttpResponse.json({}, { status: 200 })))

   await upfetch('/', {
      onRetry(...args) {
         expect(++exec).toBe(2)
         fetcherSpy(...args)
      },
   })
   expect(defaultSpy).toHaveBeenCalledTimes(1)
   expect(fetcherSpy).toHaveBeenCalledTimes(1)
})
