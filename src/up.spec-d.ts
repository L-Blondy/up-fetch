/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { up } from './up.js'
import { JsonifiableArray, JsonifiableObject, UpFetchOptions } from './types.js'

test('infer TData', async () => {
   const upfetch = up(fetch, () => ({
      parseResponse: (res, options) => Promise.resolve(1),
   }))
   const data1 = await upfetch('')
   expectTypeOf(data1).toEqualTypeOf<number>()

   const data2 = await upfetch('', {
      parseResponse: (res, options) => Promise.resolve(''),
   })
   expectTypeOf(data2).toEqualTypeOf<string>()
})

test('infer TResponseError', async () => {
   const upfetch = up(fetch, () => ({
      parseResponseError: (res, options) => Promise.resolve(1),
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
      },
   }))
   await upfetch('', {
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number>()
      },
   })
   await upfetch('', {
      parseResponseError: (res, options) => Promise.resolve(''),
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string>()
      },
   })
})

test('infer TUnknownError', async () => {
   const upfetch = up(fetch, () => ({
      parseUnknownError: (res, options) => 1,
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
      },
   }))
   await upfetch('', {
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number>()
      },
   })
   await upfetch('', {
      parseUnknownError: (res, options) => '',
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string>()
      },
   })
})

test('infer TError', async () => {
   const upfetch = up(fetch, () => ({
      parseResponseError: (res, options) => Promise.resolve(''),
      parseUnknownError: (res, options) => 1,
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
      },
   }))
   await upfetch('', {
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number | string>()
      },
   })
   await upfetch('', {
      parseResponseError: (res, options) => Promise.resolve(true),
      parseUnknownError: (res, options) => ({} as object),
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<boolean | object>()
      },
   })
})

test('The default serializeParams should expect the params only', async () => {
   const upfetch = up(fetch, () => ({
      serializeParams(params, defaultSerializer) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         // @ts-expect-error
         defaultSerializer(params, defaultSerializer)
         return defaultSerializer(params)
      },
   }))

   await upfetch('', {
      serializeParams(params, defaultSerializer) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         // @ts-expect-error
         defaultSerializer(params, defaultSerializer)
         return defaultSerializer(params)
      },
   })
})

test('The default serializeParams should expect the params only', async () => {
   const upfetch = up(fetch, () => ({
      serializeBody(body, defaultSerializer) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         // @ts-expect-error
         defaultSerializer(body, defaultSerializer)
         return defaultSerializer(body)
      },
   }))

   await upfetch('', {
      serializeParams(params, defaultSerializer) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         // @ts-expect-error
         defaultSerializer(params, defaultSerializer)
         return defaultSerializer(params)
      },
   })
})

test('callback types', async () => {
   const upfetch = up(fetch, () => ({
      onBeforeFetch(options) {
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
      },
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
      },
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
         return Promise.resolve(true)
      },
      parseUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
         return ''
      },
      serializeParams(params, defaultSerializer) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         expectTypeOf(defaultSerializer).toEqualTypeOf<
            (params: Record<string, any>) => string
         >()
         return ''
      },
      serializeBody(body, defaultSerializer) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         expectTypeOf(defaultSerializer).toEqualTypeOf<
            (body: JsonifiableObject | JsonifiableArray) => string
         >()
         return ''
      },
   }))

   await upfetch('', {
      onBeforeFetch(options) {
         expectTypeOf(options).toEqualTypeOf<
            UpFetchOptions<number, boolean, string>
         >()
      },
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string | boolean>()
         expectTypeOf(options).toEqualTypeOf<
            UpFetchOptions<number, boolean, string>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<boolean>()
         expectTypeOf(options).toEqualTypeOf<
            UpFetchOptions<number, boolean, string>
         >()
      },
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string>()
         expectTypeOf(options).toEqualTypeOf<
            UpFetchOptions<number, boolean, string>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<number>()
         expectTypeOf(options).toEqualTypeOf<
            UpFetchOptions<number, boolean, string>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
         return Promise.resolve(true)
      },
      parseUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<UpFetchOptions<any, any, any>>()
         return ''
      },
      serializeParams(params, defaultSerializer) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         expectTypeOf(defaultSerializer).toEqualTypeOf<
            (params: Record<string, any>) => string
         >()
         return ''
      },
      serializeBody(body, defaultSerializer) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         expectTypeOf(defaultSerializer).toEqualTypeOf<
            (body: JsonifiableObject | JsonifiableArray) => string
         >()
         return ''
      },
   })
})
