import { expectTypeOf, test } from 'vitest'
import {
   buildOptions,
   specificDefaultOptionsKeys,
   specificRequestOptionsKeys,
} from './buildOptions.js'
import { DefaultOptions, MergedOptions, RequestOptions } from './createFetcher.js'

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

test('mergedOptions type', () => {
   const mergedOptions = buildOptions()
   expectTypeOf(mergedOptions).toEqualTypeOf<MergedOptions<any, any>>()
})
