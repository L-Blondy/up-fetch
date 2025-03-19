import { scheduler } from 'node:timers/promises'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
   afterAll,
   afterEach,
   beforeAll,
   describe,
   expect,
   test,
   vi,
} from 'vitest'
import { up } from '..'

const baseUrl = 'https://example.com'
const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('timeout', () => {
   const majorNodeVersion = Number(
      process.version.replace('v', '').split('.')[0],
   )

   // test for node 18 & 19
   test('Should not crash', async () => {
      server.use(
         http.get(baseUrl, async () => {
            return HttpResponse.json({}, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         timeout: 1,
      }))

      await upfetch('')
   })

   if (majorNodeVersion >= 20) {
      test('should apply up.timeout when upfetch.timeout is not defined', async () => {
         server.use(
            http.get(baseUrl, async () => {
               await scheduler.wait(2)
               return HttpResponse.json({}, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: baseUrl,
            timeout: 1,
         }))

         let exec = 0
         await upfetch('').catch((error) => {
            exec++
            expect(error.name).toBe('TimeoutError')
         })
         expect(exec).toBe(1)
      })

      test('should allow upfetch.timeout to override up.timeout', async () => {
         server.use(
            http.get(baseUrl, async () => {
               await scheduler.wait(2)
               return HttpResponse.json({}, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: baseUrl,
            timeout: undefined,
         }))

         let exec = 0
         await upfetch('').catch((error) => {
            exec++
            expect(error.name).toBe('TimeoutError')
         })
         expect(exec).toBe(0)
      })

      test('should maintain timeout functionality when an AbortSignal is passed to upfetch.signal', async () => {
         server.use(
            http.get(baseUrl, async () => {
               await scheduler.wait(2)
               return HttpResponse.json({}, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: baseUrl,
            timeout: 1,
         }))

         let exec = 0
         await upfetch('', {
            signal: new AbortController().signal,
         }).catch((error) => {
            exec++
            expect(error.name).toBe('TimeoutError')
         })
         expect(exec).toBe(1)
      })

      test('should maintain upfetch.signal functionality when timeout is defined', async () => {
         server.use(
            http.get(baseUrl, async () => {
               await scheduler.wait(10000)
               return HttpResponse.json({}, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: baseUrl,
            timeout: 9000,
         }))

         let exec = 0
         const controller = new AbortController()
         const signal = controller.signal
         const promise = upfetch('', {
            signal,
         }).catch((error) => {
            exec++
            expect(error.name).toBe('AbortError')
         })
         controller.abort()
         await promise
         expect(exec).toBe(1)
      })

      describe('environment compatibility', () => {
         beforeAll(() => {
            vi.stubGlobal('AbortSignal', {})
         })

         afterAll(() => {
            vi.unstubAllGlobals()
         })

         test('should gracefully handle environments without AbortSignal.any and AbortSignal.timeout', async () => {
            server.use(
               http.get(baseUrl, async () => {
                  await scheduler.wait(2)
                  return HttpResponse.json({}, { status: 200 })
               }),
            )

            const upfetch = up(fetch, () => ({
               baseUrl: baseUrl,
            }))

            const controller = new AbortController()
            const signal = controller.signal
            await upfetch('', {
               // having both timeout and signal will use AbortSignal.any
               timeout: 1,
               signal,
            })
         })
      })
   }
})
