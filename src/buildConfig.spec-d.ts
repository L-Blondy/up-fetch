import { expectTypeOf, test } from 'vitest'
import { Config, specificDefaultConfigKeys, specificRequestConfigKeys } from './buildConfig'
import { DefaultConfig, RequestConfig } from './createFetcher'

type TupleToUnion<T extends readonly unknown[]> = T[number]

test('specific DefaultConfig Keys', () => {
   const _specificDefaultConfigKeysAsUnionType = 'onError' as TupleToUnion<
      typeof specificDefaultConfigKeys
   >
   type SpecificDefaultConfigKeys = Exclude<keyof DefaultConfig, keyof RequestConfig>

   expectTypeOf(_specificDefaultConfigKeysAsUnionType).toEqualTypeOf<SpecificDefaultConfigKeys>()
})

test('specific Request Config Keys', () => {
   const _specificRequestConfigKeysAsUnionType = 'body' as TupleToUnion<
      typeof specificRequestConfigKeys
   >
   type SpecificRequestConfigKeys = Exclude<keyof RequestConfig, keyof DefaultConfig>

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
   expectTypeOf(config.onError).toEqualTypeOf<NonNullable<DefaultConfig['onError']>>()
   expectTypeOf(config.onFetchStart).toEqualTypeOf<NonNullable<DefaultConfig['onFetchStart']>>()
   expectTypeOf(config.onSuccess).toEqualTypeOf<NonNullable<DefaultConfig['onSuccess']>>()
   expectTypeOf(config.params).toEqualTypeOf<NonNullable<RequestConfig['params']>>()
   expectTypeOf(config.parseError).toEqualTypeOf<NonNullable<DefaultConfig['parseError']>>()
   expectTypeOf(config.parseSuccess).toEqualTypeOf<NonNullable<DefaultConfig['parseSuccess']>>()
   expectTypeOf(config.redirect).toEqualTypeOf<RequestConfig['redirect']>()
   expectTypeOf(config.referrer).toEqualTypeOf<RequestConfig['referrer']>()
   expectTypeOf(config.referrerPolicy).toEqualTypeOf<RequestConfig['referrerPolicy']>()
   expectTypeOf(config.serializeBody).toEqualTypeOf<NonNullable<DefaultConfig['serializeBody']>>()
   expectTypeOf(config.serializeParams).toEqualTypeOf<
      NonNullable<DefaultConfig['serializeParams']>
   >()
   expectTypeOf(config.signal).toEqualTypeOf<RequestInit['signal']>()
   expectTypeOf(config.url).toEqualTypeOf<NonNullable<RequestConfig['url']>>()
   expectTypeOf(config.window).toEqualTypeOf<RequestInit['window']>()
})
