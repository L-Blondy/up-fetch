import { scheduler } from 'node:timers/promises'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { up } from 'src/up'
import {
   afterAll,
   afterEach,
   beforeAll,
   expect,
   expectTypeOf,
   test,
   vi,
} from 'vitest'
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
      reject: () => false,
      retry: {
         limit: 1,
         when({ response, request }) {
            spy()
            expectTypeOf(response).toEqualTypeOf<Response>()
            expect(response instanceof Response).toBe(true)
            return false
         },
      },
   }))
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 500 }),
      ),
   )
   const spy = vi.fn()

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should not call retry.when or retry.delay when retry.limit returns 0', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: whenSpy,
         limit: () => 0,
         delay: delaySpy,
      },
   }))
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 500 }),
      ),
   )
   const whenSpy = vi.fn()
   const delaySpy = vi.fn()

   await upfetch('/')
   expect(whenSpy).not.toHaveBeenCalled()
   expect(delaySpy).not.toHaveBeenCalled()
})

test('should call retry.limit with the request when retry.when returns true', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: () => true,
         limit({ request }) {
            spy()
            expectTypeOf(request).toEqualTypeOf<Request>()
            expect(request instanceof Request).toBe(true)
            return 0
         },
      },
   }))

   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 500 }),
      ),
   )
   const spy = vi.fn()

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should not call retry.delay when retry.limit returns 0', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: () => true,
         limit: () => 0,
         delay: spy,
      },
   }))
   server.use(
      http.get(baseUrl, () =>
         HttpResponse.json({ hello: 'world' }, { status: 500 }),
      ),
   )
   const spy = vi.fn()

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(0)
})

test('should call retry.delay with the attempt number and response when retry.when returns true and retry.limit returns more than 0', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: () => true,
         limit: () => 1,
         delay({ attempt, response, request }) {
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
         HttpResponse.json({ hello: 'world' }, { status: 500 }),
      ),
   )
   const spy = vi.fn()

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(1)
})

test('should retry `N = retry.limit()` times when retry.when returns true', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         limit: 1,
         when: () => true,
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   await upfetch('/')
   expect(spy).toHaveBeenCalledTimes(2)
})

test('should call retry.limit, then retry.when then retry.delay', async () => {
   let exec = 0
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         limit: () => {
            expect(++exec).toBe(1)
            return 1
         },
         when: () => {
            expect(++exec).toBe(2)
            return true
         },
         delay: () => {
            expect(++exec).toBe(3)
            return 0
         },
      },
   }))

   server.use(
      http.get(baseUrl, async () => {
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   await upfetch('/', {
      retry: { when: () => false },
   })
})

test('should allow upfetch.limit to override up.limit', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: () => true,
         limit: 1,
      },
   }))
   const spy = vi.fn()

   server.use(
      http.get(baseUrl, async () => {
         spy()
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   await upfetch('/', {
      retry: { limit: 2 },
   })
   // no retry
   expect(spy).toHaveBeenCalledTimes(3)
})

test('should handle errors during limit function execution', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: () => true,
         limit: () => {
            throw new Error('limit error')
         },
      },
   }))

   server.use(
      http.get(baseUrl, async () => HttpResponse.json({}, { status: 500 })),
   )

   let exec = 0

   await upfetch('/').catch((error) => {
      exec++
      expect(error.name).toBe('Error')
   })
   expect(exec).toBe(1)
})

test('should handle errors during retry.delay function execution', async () => {
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: () => true,
         limit: 1,
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
      reject: () => false,
      retry: {
         when: () => true,
         limit: 2,
      },
   }))

   server.use(
      http.get(baseUrl, async () => {
         await new Promise((resolve) => setTimeout(resolve, 200)) // Delay longer than timeout
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   let exec = 0

   await upfetch('/').catch((error) => {
      exec++
      expect(error.name).toBe('TimeoutError')
   })
   expect(exec).toBe(1)
})

test('should not retry when request is aborted', async () => {
   const controller = new AbortController()
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: () => true,
         limit: 2,
      },
   }))

   server.use(
      http.get(baseUrl, async () => {
         await new Promise((resolve) => setTimeout(resolve, 100)) // Add delay to ensure we can abort
         return HttpResponse.json({ hello: 'world' }, { status: 500 })
      }),
   )

   let exec = 0

   const promise = upfetch('/', { signal: controller.signal })
   controller.abort()
   await promise.catch((error) => {
      exec++
      expect(error.name).toBe('AbortError')
   })
   expect(exec).toBe(1)
})

test('should not call onRetry when no retry is needed', async () => {
   const onRetrySpy = vi.fn()
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      onRetry: onRetrySpy,
      reject: () => false,
      retry: {
         when: () => false,
         limit: 2,
         delay: 0,
      },
   }))

   server.use(http.get(baseUrl, () => HttpResponse.json({}, { status: 500 })))

   await upfetch('/')
   expect(onRetrySpy).not.toHaveBeenCalled()
})

test('should call onRetry before each retry attempt', async () => {
   const onRetrySpy = vi.fn()
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      onRetry: onRetrySpy,
      reject: () => false,
      retry: {
         when: () => true,
         limit: 2,
         delay: 0,
      },
   }))

   server.use(http.get(baseUrl, () => HttpResponse.json({}, { status: 500 })))

   await upfetch('/')
   expect(onRetrySpy).toHaveBeenCalledTimes(2)
   expect(onRetrySpy).toHaveBeenNthCalledWith(1, {
      attempt: 1,
      response: expect.any(HttpResponse),
      request: expect.any(Request),
   })
   expect(onRetrySpy).toHaveBeenNthCalledWith(2, {
      attempt: 2,
      response: expect.any(HttpResponse),
      request: expect.any(Request),
   })
})

test('should execute both up.onRetry and upfetch.onRetry', async () => {
   const defaultSpy = vi.fn()
   const fetcherSpy = vi.fn()

   let exec = 0

   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      onRetry(context) {
         expect(++exec).toBe(1)
         defaultSpy(context)
      },
      reject: () => false,
      retry: {
         when: () => true,
         limit: 1,
         delay: 0,
      },
   }))

   server.use(http.get(baseUrl, () => HttpResponse.json({}, { status: 500 })))

   await upfetch('/', {
      onRetry(context) {
         expect(++exec).toBe(2)
         fetcherSpy(context)
      },
   })
   expect(defaultSpy).toHaveBeenCalledTimes(1)
   expect(fetcherSpy).toHaveBeenCalledTimes(1)
})

test('should abort retry immediately if signal controller aborts during retry delay', async () => {
   const controller = new AbortController()
   const upfetch = up(withRetry(fetch), () => ({
      baseUrl,
      reject: () => false,
      retry: {
         when: () => true,
         limit: 2,
         delay: 1000,
      },
   }))

   server.use(
      http.get(baseUrl, async () => HttpResponse.json({}, { status: 500 })),
   )

   let exec = 0

   const promise = upfetch('/', { signal: controller.signal })
   await scheduler.wait(50)
   const now = Date.now()
   controller.abort()
   await promise.catch((error) => {
      exec++
      expect(error.name).toBe('AbortError')
   })
   expect(exec).toBe(1)
   // should not wait for the whole 1000ms delay
   expect(Date.now() - now).toBeLessThan(50)
})
