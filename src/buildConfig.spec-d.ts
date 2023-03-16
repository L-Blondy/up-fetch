import { expectTypeOf, test } from 'vitest'
import { specificFactoryConfigKeys, specificRequestConfigKeys } from './buildConfig'
import { FactoryConfig, RequestConfig } from './createFetcher'

type TupleToUnion<T extends readonly unknown[]> = T[number]

test('specific Factory Config Keys', () => {
   const _specificFactoryConfigKeysAsUnionType = 'onError' as TupleToUnion<
      typeof specificFactoryConfigKeys
   >
   type SpecificFactoryConfigKeys = Exclude<keyof FactoryConfig, keyof RequestConfig>

   expectTypeOf(_specificFactoryConfigKeysAsUnionType).toEqualTypeOf<SpecificFactoryConfigKeys>()
})

test('specific Upfetch Config Keys', () => {
   const _specificRequestConfigKeysAsUnionType = 'body' as TupleToUnion<
      typeof specificRequestConfigKeys
   >
   type SpecificRequestConfigKeys = Exclude<keyof RequestConfig, keyof FactoryConfig>

   expectTypeOf(_specificRequestConfigKeysAsUnionType).toEqualTypeOf<SpecificRequestConfigKeys>()
})
