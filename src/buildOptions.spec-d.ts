import { expectTypeOf, test } from 'vitest'
import { Options, specificDefaultOptionsKeys, specificRequestOptionsKeys } from './buildOptions'
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

test('Options type', () => {
   const options: Options = {} as any

   expectTypeOf(options.baseUrl).toEqualTypeOf<NonNullable<RequestOptions['baseUrl']>>()
   expectTypeOf(options.body).toEqualTypeOf<RequestInit['body']>()
   expectTypeOf(options.cache).toEqualTypeOf<RequestInit['cache']>()
   expectTypeOf(options.credentials).toEqualTypeOf<RequestInit['credentials']>()
   expectTypeOf(options.headers).toEqualTypeOf<Headers>()
   expectTypeOf(options.integrity).toEqualTypeOf<RequestInit['integrity']>()
   expectTypeOf(options.keepalive).toEqualTypeOf<RequestInit['keepalive']>()
   expectTypeOf(options.method).toEqualTypeOf<RequestOptions['method']>()
   expectTypeOf(options.mode).toEqualTypeOf<RequestInit['mode']>()
   expectTypeOf(options.onError).toEqualTypeOf<NonNullable<DefaultOptions['onError']>>()
   expectTypeOf(options.onFetchStart).toEqualTypeOf<NonNullable<DefaultOptions['onFetchStart']>>()
   expectTypeOf(options.onSuccess).toEqualTypeOf<NonNullable<DefaultOptions['onSuccess']>>()
   expectTypeOf(options.params).toEqualTypeOf<NonNullable<RequestOptions['params']>>()
   expectTypeOf(options.parseError).toEqualTypeOf<NonNullable<DefaultOptions['parseError']>>()
   expectTypeOf(options.parseSuccess).toEqualTypeOf<NonNullable<DefaultOptions['parseSuccess']>>()
   expectTypeOf(options.redirect).toEqualTypeOf<RequestOptions['redirect']>()
   expectTypeOf(options.referrer).toEqualTypeOf<RequestOptions['referrer']>()
   expectTypeOf(options.referrerPolicy).toEqualTypeOf<RequestOptions['referrerPolicy']>()
   expectTypeOf(options.serializeBody).toEqualTypeOf<NonNullable<DefaultOptions['serializeBody']>>()
   expectTypeOf(options.serializeParams).toEqualTypeOf<
      NonNullable<DefaultOptions['serializeParams']>
   >()
   expectTypeOf(options.signal).toEqualTypeOf<RequestInit['signal']>()
   expectTypeOf(options.url).toEqualTypeOf<NonNullable<RequestOptions['url']>>()
   expectTypeOf(options.window).toEqualTypeOf<RequestInit['window']>()
})
