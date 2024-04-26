/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { up } from './up'
import { JsonifiableArray, JsonifiableObject, ComputedOptions } from './types'
import { fallbackOptions } from './fallback-options'
import { ResponseError } from './response-error'

test('infer TData', async () => {
   const upfetch = up(fetch, () => ({
      parseResponse: (res, options) => Promise.resolve(1),
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<any>()
      },
   }))
   const data1 = await upfetch('', {
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<number>()
      },
   })
   expectTypeOf(data1).toEqualTypeOf<number>()

   const data2 = await upfetch('', {
      parseResponse: (res, options) => Promise.resolve(''),
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<string>()
      },
   })
   expectTypeOf(data2).toEqualTypeOf<string>()

   const data3 = await upfetch('', () => ({
      parseResponse: (res, options) => Promise.resolve(''),
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<string>()
      },
   }))
   expectTypeOf(data3).toEqualTypeOf<string>()

   const data4 = await upfetch('', (defaultOptions) => ({
      parseResponse: defaultOptions.parseResponse,
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<number>()
      },
   }))
   expectTypeOf(data4).toEqualTypeOf<number>()
})

test('infer TResponseError', async () => {
   up(fetch)('', {
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<ResponseError>()
      },
   })

   const upfetch = up(fetch, () => ({
      parseResponseError: (_) => Promise.resolve(1),
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
   await upfetch('', (defaultOptions) => ({
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number>()
      },
   }))
   await upfetch('', (defaultOptions) => ({
      parseResponseError: (res, options) => Promise.resolve(''),
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<string>()
      },
   }))
   await upfetch('', (defaultOptions) => ({
      parseResponseError: defaultOptions.parseResponseError,
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<number>()
      },
   }))
})

test('The defaultSerializer of params should expect 1 arg only (the params)', async () => {
   const upfetch = up(fetch, () => ({
      serializeParams(params) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         return fallbackOptions.serializeParams(params)
      },
   }))

   await upfetch('', {
      serializeParams(params) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         return fallbackOptions.serializeParams(params)
      },
   })
   await upfetch('', (defaultOptions) => ({
      serializeParams(params) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         return fallbackOptions.serializeParams(params)
      },
   }))
})

test('The defaultSerializer of body should expect 1 arg only (the body)', async () => {
   const upfetch = up(fetch, () => ({
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         return fallbackOptions.serializeBody(body)
      },
   }))

   await upfetch('', {
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         return fallbackOptions.serializeBody(body)
      },
   })
   await upfetch('', (defaultOptions) => ({
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         return fallbackOptions.serializeBody(body)
      },
   }))
})

test('callback types', async () => {
   const upfetch = up(fetch, () => ({
      onBeforeFetch(options) {
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
      },
      onParsingError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
      },
      onRequestError(error, options) {
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
         return Promise.resolve(true)
      },
      serializeParams(params) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         return ''
      },
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         return ''
      },
   }))

   await upfetch('', {
      onBeforeFetch(options) {
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, typeof fetch>
         >()
      },
      onParsingError(error, options) {
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<boolean>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, typeof fetch>
         >()
      },
      onRequestError(error, options) {
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, typeof fetch>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<number>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, typeof fetch>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
         return Promise.resolve(true)
      },
      serializeParams(params) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         return ''
      },
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
         >()
         return ''
      },
   })

   await upfetch('', (defaultOptions) => ({
      onBeforeFetch(options) {
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, typeof fetch>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<boolean>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, typeof fetch>
         >()
      },
      onRequestError(error, options) {
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, typeof fetch>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<number>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<number, boolean, typeof fetch>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<any, any, typeof fetch>
         >()
         return Promise.resolve(true)
      },
      serializeParams(params) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         return ''
      },
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<
            JsonifiableObject | JsonifiableArray
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

   upfetch('', (defaultOptions) => ({
      additionalOption: '',
      onBeforeFetch(options) {
         options.additionalOption
      },
   }))
})

test('When the fetcher options are functional, They should receive the fully infered defaultOptions as argument', async () => {
   const defaultOptions = {
      parseResponse: () => Promise.resolve(1),
      parseResponseError: () => Promise.resolve(''),
      params: { a: 1, b: true },
      headers: { c: 2, d: 'false' },
   } as const

   const upfetch = up(fetch, () => defaultOptions)

   // @ts-expect-error type check dhould still work on the return type
   upfetch('', (defaultOptions) => {
      expectTypeOf(defaultOptions).toEqualTypeOf<typeof defaultOptions>()

      return { headers: '' } // This incorrect return type produces the error
   })
})
