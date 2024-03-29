/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { up } from './up.js'
import {
   JsonifiableArray,
   JsonifiableObject,
   ComputedOptions,
} from './types.js'

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

   const data3 = await upfetch('', () => ({
      parseResponse: (res, options) => Promise.resolve(''),
   }))
   expectTypeOf(data3).toEqualTypeOf<string>()

   const data4 = await upfetch('', (upOptions) => ({
      parseResponse: upOptions.parseResponse,
   }))
   expectTypeOf(data4).toEqualTypeOf<number>()
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
   await upfetch('', (upOpts) => ({
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number>()
      },
   }))
   await upfetch('', (upOpts) => ({
      parseResponseError: (res, options) => Promise.resolve(''),
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string>()
      },
   }))
   await upfetch('', (upOpts) => ({
      parseResponseError: upOpts.parseResponseError,
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number>()
      },
   }))
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
   await upfetch('', (upOpts) => ({
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number>()
      },
   }))
   await upfetch('', (upOpts) => ({
      parseUnknownError: (res, options) => '',
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string>()
      },
   }))
   await upfetch('', (upOpts) => ({
      parseUnknownError: upOpts.parseUnknownError,
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number>()
      },
   }))
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
   await upfetch('', (upOpts) => ({
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number | string>()
      },
   }))
   await upfetch('', (upOpts) => ({
      parseResponseError: (res, options) => Promise.resolve(true),
      parseUnknownError: (res, options) => ({} as object),
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<boolean | object>()
      },
   }))
   await upfetch('', (upOpts) => ({
      parseResponseError: upOpts.parseResponseError,
      parseUnknownError: upOpts.parseUnknownError,
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string | number>()
      },
   }))
})

test('The defaultSerializer of params should expect 1 arg only (the params)', async () => {
   const upfetch = up(fetch, () => ({
      serializeParams(params, defaultSerializer) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         defaultSerializer(params)
         // @ts-expect-error
         defaultSerializer(params, defaultSerializer)
         return defaultSerializer(params)
      },
   }))

   await upfetch('', {
      serializeParams(params, defaultSerializer) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         defaultSerializer(params)
         // @ts-expect-error
         defaultSerializer(params, defaultSerializer)
         return defaultSerializer(params)
      },
   })
   await upfetch('', (upOpts) => ({
      serializeParams(params, defaultSerializer) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         defaultSerializer(params)
         // @ts-expect-error
         defaultSerializer(params, defaultSerializer)
         return defaultSerializer(params)
      },
   }))
})

test('The defaultSerializer of body should expect 1 arg only (the body)', async () => {
   const upfetch = up(fetch, () => ({
      serializeBody(body, defaultSerializer) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         defaultSerializer(body)
         // @ts-expect-error
         defaultSerializer(body, defaultSerializer)
         return defaultSerializer(body)
      },
   }))

   await upfetch('', {
      serializeBody(body, defaultSerializer) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         // @ts-expect-error
         defaultSerializer(body, defaultSerializer)
         return defaultSerializer(body)
      },
   })
   await upfetch('', (upOpts) => ({
      serializeBody(body, defaultSerializer) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         // @ts-expect-error
         defaultSerializer(body, defaultSerializer)
         return defaultSerializer(body)
      },
   }))
})

test('callback types', async () => {
   const upfetch = up(fetch, () => ({
      onBeforeFetch(options) {
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
      },
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
      },
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
         return Promise.resolve(true)
      },
      parseUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
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
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string | boolean>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<boolean>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<number>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
         return Promise.resolve(true)
      },
      parseUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
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

   await upfetch('', (upOpts) => ({
      onBeforeFetch(options) {
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      onError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string | boolean>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<boolean>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      onUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<number>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, string, typeof fetch>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
         return Promise.resolve(true)
      },
      parseUnknownError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, any, typeof fetch>
         >()
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
})

test('base fetch type should be extended', async () => {
   type CustomFetchType = (
      input: RequestInfo | URL,
      init?: RequestInit & { additionalOption?: string },
   ) => Promise<Response>

   // @ts-expect-error additionalOption should be string | undefined
   const upfetch = up(fetch as CustomFetchType, () => ({
      additionalOption: 1,
   }))

   upfetch('', {
      additionalOption: '',
      onBeforeFetch(options) {
         options.additionalOption
      },
   })

   upfetch('', (upOpts) => ({
      additionalOption: '',
      onBeforeFetch(options) {
         options.additionalOption
      },
   }))
})

test('When the fetcher options are functional, They should receive the fully infered upOptions as argument', async () => {
   const upOpts = {
      parseResponse: () => Promise.resolve(1),
      parseResponseError: () => Promise.resolve(''),
      parseUnknownError: () => true,
      params: { a: 1, b: true },
      headers: { c: 2, d: 'false' },
   } as const

   const upfetch = up(fetch, () => upOpts)

   // @ts-expect-error type check dhould still work on the return type
   upfetch('', (upOptions) => {
      expectTypeOf(upOptions).toEqualTypeOf<typeof upOpts>()

      return { headers: '' } // This incorrect return type produces the error
   })
})
