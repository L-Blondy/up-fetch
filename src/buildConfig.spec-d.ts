import { expectTypeOf, test } from 'vitest'
import { Config, specificFactoryConfigKeys, specificRequestConfigKeys } from './buildConfig'
import { FactoryConfig, RequestConfig } from './createFetcher'

type TupleToUnion<T extends readonly unknown[]> = T[number]

test('specific Factory Config Keys', () => {
   const _specificFactoryConfigKeysAsUnionType = 'onError' as TupleToUnion<
      typeof specificFactoryConfigKeys
   >
   type SpecificFactoryConfigKeys = Exclude<keyof FactoryConfig, keyof RequestConfig>

   expectTypeOf(_specificFactoryConfigKeysAsUnionType).toEqualTypeOf<SpecificFactoryConfigKeys>()
})

test('specific Request Config Keys', () => {
   const _specificRequestConfigKeysAsUnionType = 'body' as TupleToUnion<
      typeof specificRequestConfigKeys
   >
   type SpecificRequestConfigKeys = Exclude<keyof RequestConfig, keyof FactoryConfig>

   expectTypeOf(_specificRequestConfigKeysAsUnionType).toEqualTypeOf<SpecificRequestConfigKeys>()
})

test('Config type', () => {
   const config: Config = {} as any

   expectTypeOf(config.baseUrl).toEqualTypeOf<NonNullable<RequestConfig['baseUrl']>>()
   expectTypeOf(config.body).toEqualTypeOf<RequestInit['body']>()
   expectTypeOf(config.cache).toEqualTypeOf<RequestInit['cache']>()
   expectTypeOf(config.credentials).toEqualTypeOf<RequestInit['credentials']>()
   expectTypeOf(config.headers).toEqualTypeOf<Headers>()
   expectTypeOf(config.integrity).toEqualTypeOf<RequestInit['integrity']>()
   expectTypeOf(config.keepalive).toEqualTypeOf<RequestInit['keepalive']>()
   expectTypeOf(config.method).toEqualTypeOf<RequestConfig['method']>()
   expectTypeOf(config.mode).toEqualTypeOf<RequestInit['mode']>()
   expectTypeOf(config.onError).toEqualTypeOf<NonNullable<FactoryConfig['onError']>>()
   expectTypeOf(config.onFetchStart).toEqualTypeOf<NonNullable<FactoryConfig['onFetchStart']>>()
   expectTypeOf(config.onSuccess).toEqualTypeOf<NonNullable<FactoryConfig['onSuccess']>>()
   expectTypeOf(config.params).toEqualTypeOf<NonNullable<RequestConfig['params']>>()
   expectTypeOf(config.parseError).toEqualTypeOf<NonNullable<FactoryConfig['parseError']>>()
   expectTypeOf(config.parseSuccess).toEqualTypeOf<NonNullable<FactoryConfig['parseSuccess']>>()
   expectTypeOf(config.redirect).toEqualTypeOf<RequestConfig['redirect']>()
   expectTypeOf(config.referrer).toEqualTypeOf<RequestConfig['referrer']>()
   expectTypeOf(config.referrerPolicy).toEqualTypeOf<RequestConfig['referrerPolicy']>()
   expectTypeOf(config.serializeBody).toEqualTypeOf<NonNullable<FactoryConfig['serializeBody']>>()
   expectTypeOf(config.serializeParams).toEqualTypeOf<
      NonNullable<FactoryConfig['serializeParams']>
   >()
   expectTypeOf(config.signal).toEqualTypeOf<RequestInit['signal']>()
   expectTypeOf(config.url).toEqualTypeOf<NonNullable<RequestConfig['url']>>()
   expectTypeOf(config.window).toEqualTypeOf<RequestInit['window']>()
})
