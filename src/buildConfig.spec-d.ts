import { expectTypeOf, test } from 'vitest'
import { specificFactoryConfigKeys, specificUpfetchConfigKeys } from './buildConfig'
import { FactoryConfig, UpfetchConfig } from './upfetchFactory'

type TupleToUnion<T extends readonly unknown[]> = T[number]

test('specific Factory Config Keys', () => {
   const _specificFactoryConfigKeysAsUnionType = 'onError' as TupleToUnion<
      typeof specificFactoryConfigKeys
   >
   type SpecificFactoryConfigKeys = Exclude<keyof FactoryConfig, keyof UpfetchConfig>

   expectTypeOf(_specificFactoryConfigKeysAsUnionType).toEqualTypeOf<SpecificFactoryConfigKeys>()
})

test('specific Upfetch Config Keys', () => {
   const _specificUpfetchConfigKeysAsUnionType = 'body' as TupleToUnion<
      typeof specificUpfetchConfigKeys
   >
   type SpecificUpfetchConfigKeys = Exclude<keyof UpfetchConfig, keyof FactoryConfig>

   expectTypeOf(_specificUpfetchConfigKeysAsUnionType).toEqualTypeOf<SpecificUpfetchConfigKeys>()
})
