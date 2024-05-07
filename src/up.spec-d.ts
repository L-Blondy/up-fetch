/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expectTypeOf, test } from 'vitest'
import { up } from './up'
import { JsonifiableArray, JsonifiableObject, ComputedOptions } from './types'
import { fallbackOptions } from './fallback-options'
import { ResponseError } from './response-error'
import { withZod } from './parsers/zod'
import { z } from 'zod'

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

   const upfetch2 = up(fetch)

   const data5 = await upfetch2('')
   expectTypeOf(data5).toEqualTypeOf<any>()
   const data6 = await upfetch2('', {
      parseResponse: (res) => res,
      onSuccess(data) {
         expectTypeOf(data).toEqualTypeOf<Response>()
      },
   })
   expectTypeOf(data6).toEqualTypeOf<Response>()
   const data7 = await upfetch2('', {
      parseResponse: (res) => ({ res }),
      transform: ({ res }) => res.text(),
      onSuccess(data) {
         expectTypeOf(data).toEqualTypeOf<string>()
      },
   })
   expectTypeOf(data7).toEqualTypeOf<string>()
   const data8 = await upfetch2('', {
      transform: () => 1,
      onSuccess(data) {
         expectTypeOf(data).toEqualTypeOf<number>()
      },
   })
   expectTypeOf(data8).toEqualTypeOf<number>()

   // Using currying
   const curried = () => (res: Response) => res.text()
   const data9 = await upfetch2('', {
      parseResponse: curried(),
      transform: (data) => data,
      onSuccess(data) {
         expectTypeOf(data).toEqualTypeOf<string>()
      },
   })
   expectTypeOf(data9).toEqualTypeOf<string>()

   // using currying with generic
   const data10a = await upfetch2('', {
      parseResponse: withZod(z.object({ a: z.string() })),
      onSuccess(data) {
         expectTypeOf(data).toEqualTypeOf<{ a: string }>()
      },
   })
   expectTypeOf(data10a).toEqualTypeOf<{ a: string }>()

   const data10b = await upfetch2('', () => ({
      parseResponse: withZod(z.object({ a: z.string() })),
      onSuccess(data) {
         expectTypeOf(data).toEqualTypeOf<{ a: string }>()
      },
   }))
   expectTypeOf(data10b).toEqualTypeOf<{ a: string }>()

   // using currying with generic + transform
   const data11a = await upfetch2('', {
      parseResponse: withZod(z.object({ a: z.string() })),
      transform: (data) => data,
      onSuccess(data) {
         expectTypeOf(data).toEqualTypeOf<{ a: string }>()
      },
   })
   expectTypeOf(data11a).toEqualTypeOf<{ a: string }>()

   const data11b = await upfetch2('', () => ({
      parseResponse: withZod(z.object({ a: z.string() })),
      transform: (data) => data,
      onSuccess(data) {
         expectTypeOf(data).toEqualTypeOf<{ a: string }>()
      },
   }))
   expectTypeOf(data11b).toEqualTypeOf<{ a: string }>()

   // transform from default parseResponse
   const upfetch3 = up(fetch, () => ({
      parseResponse: async (res) => ({
         json: await res.json(),
         status: res.status,
      }),
   }))

   const data12 = await upfetch3('/todos', {
      transform: (data, options) => {
         expectTypeOf(data).toEqualTypeOf<{ json: any; status: number }>()
         return 1
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<number>()
      },
   })
   expectTypeOf(data12).toEqualTypeOf<number>()
})

test('infer TError', async () => {
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
   const fetcher = (
      input: Parameters<typeof fetch>[0],
      init: Parameters<typeof fetch>[1] & { test?: number },
   ) => fetch(input, init)

   const upfetch = up(fetcher, () => ({
      onBeforeFetch(options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
      },
      onParsingError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
      },
      onResponseError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
      },
      onRequestError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
      },
      onSuccess(data, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(data).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
      },
      onTransformError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
      },
      parseResponse(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
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
      transform: (n) => n.toString(),
      onBeforeFetch(options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onParsingError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<boolean>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onRequestError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(data).toEqualTypeOf<string>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onTransformError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
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
      transform: (n) => n.toString(),
      onBeforeFetch(options) {
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onResponseError(error, options) {
         expectTypeOf(error).toEqualTypeOf<boolean>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onRequestError(error, options) {
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<string>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      onTransformError(error, options) {
         expectTypeOf(error).toEqualTypeOf<Error>()
         expectTypeOf(options).toEqualTypeOf<
            ComputedOptions<typeof fetcher, string, boolean, number>
         >()
      },
      parseResponse(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ComputedOptions<typeof fetcher>>()
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

test('base fetch type should be extended', async () => {
   type CustomFetchType = (
      input: RequestInfo | URL,
      init?: RequestInit & { additionalOption: string },
   ) => Promise<Response>
   const fetchFn: CustomFetchType = (() => {}) as any

   const upfetch = up(fetchFn, () => ({
      additionalOption: '1',
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

describe('up should accept a fetcher with', () => {
   test('< input', async () => {
      type FetchFn = (
         input: string,
         options: Parameters<typeof fetch>[1],
      ) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
      const upfetch = up(fetchFn)
      upfetch('')
      // @ts-expect-error accept string only
      upfetch(new URL(''))
   })
   test('> input', async () => {
      type FetchFn = (
         input: string | URL | Request | number,
         options: Parameters<typeof fetch>[1],
      ) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
      const upfetch = up(fetchFn)
      upfetch('')
      upfetch(new Request(''))
      upfetch(new URL(''))
      upfetch(1)
   })
   test('< options', async () => {
      type FetchFn = (
         input: Parameters<typeof fetch>[0],
         options: Omit<NonNullable<Parameters<typeof fetch>[1]>, 'cache'>,
      ) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
      const upfetch = up(fetchFn)
      upfetch('', { keepalive: true })
      // @ts-expect-error cache is not an option
      upfetch('', { cache: 'no-store' })
   })
   test('> options', async () => {
      type FetchFn = (
         input: Parameters<typeof fetch>[0],
         options: Parameters<typeof fetch>[1] & { newOption: string },
      ) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
      const upfetch = up(fetchFn)
      upfetch('', { baseUrl: '', keepalive: true, newOption: '' })
      // @ts-expect-error newOption is required
      upfetch('', { baseUrl: '', keepalive: true })
   })
   test('< args', async () => {
      type FetchFn = (input: Parameters<typeof fetch>[0]) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
      fetchFn('')
      // @ts-expect-error accept one arg only
      fetchFn('', {})
   })
   test('> args', async () => {
      type FetchFn = (
         input: Parameters<typeof fetch>[0],
         options: Parameters<typeof fetch>[1],
         ctx: Record<string, string>,
      ) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
      const upfetch = up(fetchFn)
      upfetch('', {}, {})
      upfetch('', {})
      // @ts-expect-error invalid 3rd arg
      upfetch('', {}, '')
      // @ts-expect-error 3 args max
      upfetch('', {}, {}, '')
   })
})
