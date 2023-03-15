import { expectTypeOf, test } from 'vitest'
import { nanioFactory } from './nanioFactory'

const fakeFetch = () => Promise.resolve({ then: () => {} })

test('return type', () => {
   const nanio1 = nanioFactory.create(
      () => ({
         parseSuccess: () =>
            Promise.resolve({
               a: 1,
               b: 2,
            }),
      }),
      fakeFetch,
   )

   nanio1().then((data) => {
      expectTypeOf(data).toEqualTypeOf<{ a: number; b: number }>()
   })

   nanio1({ parseSuccess: () => Promise.resolve({ c: true, d: false }) }).then((data) => {
      expectTypeOf(data).toEqualTypeOf<{ c: boolean; d: boolean }>()
   })

   const nanio2 = nanioFactory.create(() => ({}), fakeFetch)

   nanio2().then((data) => {
      expectTypeOf(data).toBeAny()
   })

   nanio2({ parseSuccess: () => Promise.resolve(1) }).then((data) => {
      expectTypeOf(data).toBeNumber()
   })

   const nanio3 = nanioFactory.create(
      () => ({
         parseSuccess: () => Promise.resolve(1),
      }),
      fakeFetch,
   )

   nanio3().then((data) => {
      expectTypeOf(data).toBeNumber()
   })
})

test('error type', () => {
   nanioFactory.create(
      () => ({
         onError(error) {
            expectTypeOf(error).toEqualTypeOf<any>()
         },
      }),
      fakeFetch,
   )
})

test('success type', () => {
   nanioFactory.create(
      () => ({
         onSuccess(data) {
            expectTypeOf(data).toEqualTypeOf<any>()
         },
      }),
      fakeFetch,
   )
})
