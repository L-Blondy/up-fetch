import { expectTypeOf, test } from 'vitest'
import {
   buildOptions,
   specificDefaultOptionsKeys,
   specificFetcherOptionsKeys,
} from './buildOptions.js'
import { DefaultOptions, RequestOptions, FetcherOptions } from './createFetcher.js'

type TupleToUnion<T extends readonly unknown[]> = T[number]

test('specific DefaultOptions Keys', () => {
   const _specificDefaultOptionsKeysAsUnionType = 'onError' as TupleToUnion<
      typeof specificDefaultOptionsKeys
   >
   type SpecificDefaultOptionsKeys = Exclude<keyof DefaultOptions, keyof FetcherOptions>

   expectTypeOf(_specificDefaultOptionsKeysAsUnionType).toEqualTypeOf<SpecificDefaultOptionsKeys>()
})

test('specific Request Options Keys', () => {
   const _specificFetcherOptionsKeysAsUnionType = 'body' as TupleToUnion<
      typeof specificFetcherOptionsKeys
   >
   type SpecificFetcherOptionsKeys = Exclude<keyof FetcherOptions, keyof DefaultOptions>

   expectTypeOf(_specificFetcherOptionsKeysAsUnionType).toEqualTypeOf<SpecificFetcherOptionsKeys>()
})

test('requestOptions type', () => {
   const requestOptions = buildOptions()
   expectTypeOf(requestOptions).toEqualTypeOf<RequestOptions<any, any>>()
})
