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

test('should call retryWhen with the response', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: (response) => {
         spy()
         expectTypeOf(response).toEqualTypeOf<Response>()
         expect(response instanceof Response).toBe(true)
         return false
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

test('should not call retryTimes or retryDelay when retryWhen returns false', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => false,
      retryTimes: retryTimesSpy,
      retryDelay: retryDelaySpy,
   }))
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 200 }),
      ),
   )
   const retryTimesSpy = vi.fn()
   const retryDelaySpy = vi.fn()

   await upfetch('/')
   expect(retryTimesSpy).not.toHaveBeenCalled()
   expect(retryDelaySpy).not.toHaveBeenCalled()
})

test('should call retryTimes with the response when retryWhen returns true', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes(response) {
         spy()
         expectTypeOf(response).toEqualTypeOf<Response>()
         expect(response instanceof Response).toBe(true)
         return 0
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

test('should not call retryDelay when retryTimes returns 0', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: () => 0,
      retryDelay: spy,
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

test('should call retryDelay with the attempt number and response when retryWhen returns true and retryTimes returns more than 0', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: () => 1,
      retryDelay(attempt, response) {
         spy()
         expectTypeOf(attempt).toEqualTypeOf<number>()
         expect(attempt).toBe(1)
         expectTypeOf(response).toEqualTypeOf<Response>()
         expect(response instanceof Response).toBe(true)
         return 0
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

test('should retry `N = retryTimes()` times when retryWhen returns true', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: () => 1,
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

test('should call retryWhen, then retryTimes then retryDelay', async () => {
   let exec = 0
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => {
         expect(++exec).toBe(1)
         return true
      },
      retryTimes: () => {
         expect(++exec).toBe(2)
         return 1
      },
      retryDelay: () => {
         expect(++exec).toBe(3)
         return 0
      },
   }))

   server.use(
      http.get(baseUrl, async () => {
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await upfetch('/', {
      retryWhen: () => false,
   })
})

test('should allow upfetch.retryWhen to override up.retryWhen', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: 1,
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await upfetch('/', {
      retryWhen: () => false,
   })
   // no retry
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should allow upfetch.retryTimes to override up.retryTimes', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: 1,
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 200 })
      }),
   )

   await upfetch('/', {
      retryTimes: 2,
   })
   // no retry
   expect(spy).toHaveBeenCalledTimes(3)
})

test('should allow upfetch.retryDelay to override up.retryDelay', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: 1,
      retryDelay: 2000,
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
      retryDelay: 100,
   })
   const duration = Date.now() - start
   expect(duration).toBeGreaterThanOrEqual(100)
   expect(duration).toBeLessThanOrEqual(110)
})

test('should handle defaultRetryWhen for all specified status codes', async () => {
   const statusCodes = [408, 409, 425, 429, 500, 502, 503, 504]
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryTimes: 1,
      reject: () => false, // Don't throw on error responses
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
      retryTimes: 1,
      reject: () => false, // Don't throw on error responses
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

test('should handle errors during retryTimes function execution', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: () => {
         throw new Error('retryTimes error')
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   await expect(upfetch('/')).rejects.toThrow('retryTimes error')
   expect(spy).toHaveBeenCalledTimes(1) // Only initial request, no retries due to error
})

test('should handle errors during retryDelay function execution', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: 1,
      retryDelay: () => {
         throw new Error('retryDelay error')
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   await expect(upfetch('/')).rejects.toThrow('retryDelay error')
   expect(spy).toHaveBeenCalledTimes(1) // Only initial request, no retries due to error
})

test('should not retry when request times out', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      retryWhen: () => true,
      retryTimes: 2,
      timeout: 100, // Set a short timeout
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
      retryWhen: () => true,
      retryTimes: 2,
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
