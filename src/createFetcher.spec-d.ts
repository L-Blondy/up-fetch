/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { createFetcher, DefaultOptions, FetcherOptions, RequestOptions } from './createFetcher.js'

const fakeFetch = (url?: any, options?: RequestInit) => Promise.resolve({ then: () => {} })

test('return type', () => {
   const upfetch1 = createFetcher(
      () => ({
         parseSuccess: () =>
            Promise.resolve({
               a: 1,
               b: 2,
            }),
      }),
      fakeFetch,
   )

   upfetch1().then((data) => {
      expectTypeOf(data).toEqualTypeOf<{ a: number; b: number }>()
   })

   upfetch1({ parseSuccess: () => Promise.resolve({ c: true, d: false }) }).then((data) => {
      expectTypeOf(data).toEqualTypeOf<{ c: boolean; d: boolean }>()
   })

   const upfetch2 = createFetcher(() => ({}), fakeFetch)

   upfetch2().then((data) => {
      expectTypeOf(data).toBeAny()
   })

   upfetch2({ parseSuccess: () => Promise.resolve(1) }).then((data) => {
      expectTypeOf(data).toBeNumber()
   })

   const upfetch3 = createFetcher(
      () => ({
         parseSuccess: () => Promise.resolve(1),
      }),
      fakeFetch,
   )

   upfetch3().then((data) => {
      expectTypeOf(data).toBeNumber()
   })

   const upfetch4 = createFetcher(
      () => ({
         parseSuccess: (res) => res.text(),
      }),
      fakeFetch,
   )

   upfetch4().then((data) => {
      expectTypeOf(data).toBeString()
   })

   const upfetch5 = createFetcher(
      () => ({
         parseSuccess: (res) => res.text(),
      }),
      fakeFetch,
   )

   upfetch5({ parseSuccess: () => Promise.resolve(1) }).then((data) => {
      expectTypeOf(data).toBeNumber()
   })
})

test('`onFetchStart` should receive `options', () => {
   createFetcher(() => ({
      onFetchStart: (options) => {
         expectTypeOf(options).toBeAny()
      },
   }))
})

test('`onSuccess` should receive `data` and `options`', () => {
   createFetcher(() => ({
      onSuccess: (data, options) => {
         expectTypeOf(data).toBeAny()
         expectTypeOf(options).toBeAny()
      },
   }))
})

test('`onError` should receive `error`', () => {
   createFetcher(() => ({
      onError: (error) => {
         expectTypeOf(error).toBeAny()
      },
   }))
})

test('When providing a custom `fetchFn`, the options should be extended to match the `fetchFn` options', () => {
   function fetchWithRetry(href: string, options?: RequestInit & { retries?: number }) {
      return Promise.resolve(new Response())
   }

   createFetcher(
      () => ({
         retries: 1,
         // define `onFetchStart` to check for circular reference issue if options are typed properly at some point
         onFetchStart: (options) => {
            options
         },
      }),
      fetchWithRetry,
   )({
      retries: 1,
   })
   createFetcher(
      // @ts-expect-error retries should be a number
      () => ({
         retries: '',
         // define `onFetchStart` to check for circular reference issue if options are typed properly at some point
         onFetchStart: (options) => {
            options
         },
      }),
      fetchWithRetry,
   )({
      // @ts-expect-error retries should be a number
      retries: '',
   })
})

test('`DefaultOptions` should extends `RequestInit` and its first argument (Record-like). It should not have a `body`', () => {
   // @ts-expect-error DefaultOptions first args should be Record-like
   const wrong: DefaultOptions<string> = {}
   const right: DefaultOptions<{ a?: number }> = {}
   expectTypeOf(right.a).toEqualTypeOf<number | undefined>()
   expectTypeOf(right.cache).toEqualTypeOf<RequestInit['cache']>()
   // @ts-expect-error DefaultOptions should not have a body
   expectTypeOf(right.body).toEqualTypeOf<never>()
})

test('`FetcherOptions` should extends `RequestInit` and its first argument (Record-like)', () => {
   // @ts-expect-error FetcherOptions first args should be Record-like
   const wrong: FetcherOptions<string> = {}
   const right: FetcherOptions<{ a?: number }> = {}
   expectTypeOf(right.a).toEqualTypeOf<number | undefined>()
   expectTypeOf(right.cache).toEqualTypeOf<RequestInit['cache']>()
   expectTypeOf(right.body).toEqualTypeOf<
      any[] | BodyInit | Record<string, any> | null | undefined
   >()
})

test('`RequestOptions` should extends `RequestInit` and its first argument (Record-like)', () => {
   // @ts-expect-error FetcherOptions first args should be Record-like
   const wrong: RequestOptions<string> = {}
   const right: RequestOptions<{ a?: number }, any, any> = {} as any
   expectTypeOf(right.a).toEqualTypeOf<number | undefined>()
   expectTypeOf(right.cache).toEqualTypeOf<RequestInit['cache']>()
   expectTypeOf(right.body).toEqualTypeOf<RequestInit['body']>()
   expectTypeOf(right.headers).toEqualTypeOf<Headers>()
})
