import { scheduler } from 'node:timers/promises'
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
   vi,
} from 'vitest'
import { up } from '..'

const baseUrl = 'https://example.com'
const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('retry', () => {
   test('should call retry.when with the response', async () => {
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            attempts: 1,
            delay: 100,
            when(ctx) {
               spy()
               if (ctx.response) {
                  expect(ctx.response instanceof Response).toBe(true)
               } else {
                  expect(ctx.error instanceof Error).toBe(true)
               }
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

   test('should not call retry.attempts or retry.delay when retry.when returns false', async () => {
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            when: () => false,
            attempts: attemptsSpy,
            delay: () => {
               delaySpy()
               return 0
            },
         },
      }))
      server.use(
         http.get(baseUrl, () =>
            HttpResponse.json({ hello: 'world' }, { status: 500 }),
         ),
      )
      const attemptsSpy = vi.fn()
      const delaySpy = vi.fn()

      await upfetch('/')
      expect(attemptsSpy).not.toHaveBeenCalled()
      expect(delaySpy).not.toHaveBeenCalled()
   })

   test('should call retry.attempts with the request when retry.when returns true', async () => {
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            when: () => true,
            delay: 100,
            attempts({ request }) {
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

   test('should not call retry.delay when retry.attempts returns 0', async () => {
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            when: () => true,
            attempts: () => 0,
            delay: () => {
               spy()
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
      expect(spy).toHaveBeenCalledTimes(0)
   })

   test('should call retry.delay with the attempt number and response when retry.when returns true and retry.attempts returns more than 0', async () => {
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            when: () => true,
            attempts: () => 1,
            delay({ attempt, response, error }) {
               spy()
               expectTypeOf(attempt).toEqualTypeOf<number>()
               expect(attempt).toBe(1)
               if (response) {
                  expectTypeOf(response).toEqualTypeOf<Response>()
               } else {
                  expectTypeOf(error).toEqualTypeOf<unknown>()
               }
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

   test('should retry `N = retry.attempts()` times when retry.when returns true', async () => {
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            attempts: 1,
            delay: 100,
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

   test('should allow upfetch.attempts to override up.attempts', async () => {
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            when: () => true,
            delay: 100,
            attempts: 1,
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
         retry: { attempts: 2 },
      })
      // no retry
      expect(spy).toHaveBeenCalledTimes(3)
   })

   test('should handle errors during attempts() function execution', async () => {
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            when: () => true,
            delay: 100,
            attempts: () => {
               throw new Error('attempts error')
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
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            when: () => true,
            attempts: 1,
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

   test('should not call onRetry when no retry is needed', async () => {
      const onRetrySpy = vi.fn()
      const upfetch = up(fetch, () => ({
         baseUrl,
         onRetry: onRetrySpy,
         reject: () => false,
         retry: {
            when: () => false,
            attempts: 2,
            delay: 0,
         },
      }))

      server.use(
         http.get(baseUrl, () => HttpResponse.json({}, { status: 500 })),
      )

      await upfetch('/')
      expect(onRetrySpy).not.toHaveBeenCalled()
   })

   test('should call onRetry before each retry attempt', async () => {
      const onRetrySpy = vi.fn()
      const upfetch = up(fetch, () => ({
         baseUrl,
         onRetry: onRetrySpy,
         reject: () => false,
         retry: {
            when: () => true,
            attempts: 2,
            delay: 0,
         },
      }))

      server.use(
         http.get(baseUrl, () => HttpResponse.json({}, { status: 500 })),
      )

      await upfetch('/')
      expect(onRetrySpy).toHaveBeenCalledTimes(2)
      expect(onRetrySpy).toHaveBeenNthCalledWith(1, {
         attempt: 1,
         response: expect.any(Response),
         request: expect.any(Request),
      })
      expect(onRetrySpy).toHaveBeenNthCalledWith(2, {
         attempt: 2,
         response: expect.any(Response),
         request: expect.any(Request),
      })
   })

   test('should execute up.onRequest, up.onRetry and upfetch.onRetry on each retry attempt', async () => {
      let exec = 0

      const upfetch = up(fetch, () => ({
         baseUrl,
         onRequest(request) {
            // calls 3 times
            ++exec
         },
         onRetry(context) {
            // calls 2 times
            ++exec
         },
         reject: () => false,
         retry: {
            when: () => true,
            attempts: 2,
            delay: 0,
         },
      }))

      server.use(
         http.get(baseUrl, () => HttpResponse.json({}, { status: 500 })),
      )

      await upfetch('/', {
         onRequest(request) {
            // calls 3 times
            ++exec
         },
         onRetry(context) {
            // calls 2 times
            ++exec
         },
      })
      expect(exec).toBe(10)
   })

   test('should abort retry immediately if signal controller aborts during retry delay', async () => {
      const controller = new AbortController()
      const upfetch = up(fetch, () => ({
         baseUrl,
         reject: () => false,
         retry: {
            when: () => true,
            attempts: 2,
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

   test('should allow retrying after an error', async () => {
      const spy = vi.fn()

      const upfetch = up(fetch, () => ({
         baseUrl: 'https://does.not.exist/',
         retry: {
            attempts: 2,
            delay: 0,
            when: (ctx) => !!ctx.error,
         },
         onRetry(context) {
            spy()
         },
      }))

      await upfetch('/').catch(() => {})
      expect(spy).toHaveBeenCalledTimes(2)
   })

   test('should allow retrying after a timeout', async () => {
      const spy = vi.fn()

      server.use(
         http.get(baseUrl, async () => {
            await scheduler.wait(10000)
            return HttpResponse.json({}, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl,
         timeout: 50,
         retry: {
            attempts: 2,
            when: (ctx: any) => ctx.error?.name === 'TimeoutError',
            delay: 0,
         },
         onRetry(context) {
            spy()
         },
      }))

      await upfetch('/').catch(() => {})
      expect(spy).toHaveBeenCalledTimes(2)
   })
})
