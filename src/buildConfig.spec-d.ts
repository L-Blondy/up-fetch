import { expectTypeOf, test } from 'vitest'
import { specificFactoryConfigKeys, specificNanioConfigKeys } from './buildConfig'
import { FactoryConfig, NanioConfig } from './nanioFactory'

type TupleToUnion<T extends readonly unknown[]> = T[number]

test('specific Factory Config Keys', () => {
   const _specificFactoryConfigKeysAsUnionType = 'onError' as TupleToUnion<
      typeof specificFactoryConfigKeys
   >
   type SpecificFactoryConfigKeys = Exclude<keyof FactoryConfig, keyof NanioConfig>

   expectTypeOf(_specificFactoryConfigKeysAsUnionType).toEqualTypeOf<SpecificFactoryConfigKeys>()
})

test('specific Nanio Config Keys', () => {
   const _specificNanioConfigKeysAsUnionType = 'body' as TupleToUnion<
      typeof specificNanioConfigKeys
   >
   type SpecificNanioConfigKeys = Exclude<keyof NanioConfig, keyof FactoryConfig>

   expectTypeOf(_specificNanioConfigKeysAsUnionType).toEqualTypeOf<SpecificNanioConfigKeys>()
})
