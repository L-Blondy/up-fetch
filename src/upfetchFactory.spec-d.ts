import { expectTypeOf, test } from 'vitest'
import { upfetchFactory } from './upfetchFactory'

const fakeFetch = () => Promise.resolve({ then: () => {} })

test('return type', () => {
   const upfetch1 = upfetchFactory.create(
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

   const upfetch2 = upfetchFactory.create(() => ({}), fakeFetch)

   upfetch2().then((data) => {
      expectTypeOf(data).toBeAny()
   })

   upfetch2({ parseSuccess: () => Promise.resolve(1) }).then((data) => {
      expectTypeOf(data).toBeNumber()
   })

   const upfetch3 = upfetchFactory.create(
      () => ({
         parseSuccess: () => Promise.resolve(1),
      }),
      fakeFetch,
   )

   upfetch3().then((data) => {
      expectTypeOf(data).toBeNumber()
   })
})

test('error type', () => {
   upfetchFactory.create(
      () => ({
         onError(error) {
            expectTypeOf(error).toEqualTypeOf<any>()
         },
      }),
      fakeFetch,
   )
})

test('success type', () => {
   upfetchFactory.create(
      () => ({
         onSuccess(data) {
            expectTypeOf(data).toEqualTypeOf<any>()
         },
      }),
      fakeFetch,
   )
})
