import { expectTypeOf, test } from 'vitest'
import { createFetcher } from './createFetcher.js'

const fakeFetch = () => Promise.resolve({ then: () => {} })

test('return type', () => {
   const upfetch1 = createFetcher(
      () => ({
         parseResponseOk: () =>
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

   upfetch1({ parseResponseOk: () => Promise.resolve({ c: true, d: false }) }).then((data) => {
      expectTypeOf(data).toEqualTypeOf<{ c: boolean; d: boolean }>()
   })

   const upfetch2 = createFetcher(() => ({}), fakeFetch)

   upfetch2().then((data) => {
      expectTypeOf(data).toBeAny()
   })

   upfetch2({ parseResponseOk: () => Promise.resolve(1) }).then((data) => {
      expectTypeOf(data).toBeNumber()
   })

   const upfetch3 = createFetcher(
      () => ({
         parseResponseOk: () => Promise.resolve(1),
      }),
      fakeFetch,
   )

   upfetch3().then((data) => {
      expectTypeOf(data).toBeNumber()
   })
})

test('error type', () => {
   createFetcher(
      () => ({
         onError(error) {
            expectTypeOf(error).toEqualTypeOf<any>()
         },
      }),
      fakeFetch,
   )
})

test('success type', () => {
   createFetcher(
      () => ({
         onSuccess(data) {
            expectTypeOf(data).toEqualTypeOf<any>()
         },
      }),
      fakeFetch,
   )
})
