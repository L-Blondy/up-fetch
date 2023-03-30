/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { createFetcher, RequestOptions } from './createFetcher.js'
import { ResponseError } from './ResponseError.js'

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
         expectTypeOf(options).toEqualTypeOf<RequestOptions>()
      },
   }))
})

test('`onSuccess` should receive `data` and `options`', () => {
   createFetcher(() => ({
      onSuccess: (data, options) => {
         expectTypeOf(data).toBeAny()
         expectTypeOf(options).toEqualTypeOf<RequestOptions>()
      },
   }))
})

test('`onError` should receive `error`', () => {
   createFetcher(() => ({
      onError: (error) => {
         expectTypeOf(error).toEqualTypeOf<ResponseError>()
      },
   }))
})
