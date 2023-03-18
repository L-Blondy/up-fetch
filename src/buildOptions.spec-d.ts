import { expectTypeOf, test } from 'vitest'
import { specificDefaultOptionsKeys, specificRequestOptionsKeys } from './buildOptions'
import { DefaultOptions, RequestOptions } from './createFetcher'

type TupleToUnion<T extends readonly unknown[]> = T[number]

test('specific DefaultOptions Keys', () => {
   const _specificDefaultOptionsKeysAsUnionType = 'onError' as TupleToUnion<
      typeof specificDefaultOptionsKeys
   >
   type SpecificDefaultOptionsKeys = Exclude<keyof DefaultOptions, keyof RequestOptions>

   expectTypeOf(_specificDefaultOptionsKeysAsUnionType).toEqualTypeOf<SpecificDefaultOptionsKeys>()
})

test('specific Request Options Keys', () => {
   const _specificRequestOptionsKeysAsUnionType = 'body' as TupleToUnion<
      typeof specificRequestOptionsKeys
   >
   type SpecificRequestOptionsKeys = Exclude<keyof RequestOptions, keyof DefaultOptions>

   expectTypeOf(_specificRequestOptionsKeysAsUnionType).toEqualTypeOf<SpecificRequestOptionsKeys>()
})
