/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expectTypeOf, test } from 'vitest'
import { up } from './up'
import type {
   JsonifiableArray,
   JsonifiableObject,
   ResolvedOptions,
} from './types'
import { fallbackOptions } from './fallback-options'
import { z } from 'zod'
import * as v from 'valibot'

test('infer TData', async () => {
   let upfetch = up(fetch, () => ({
      parseResponse: (res, options) => Promise.resolve(1),
      onSuccess(data, options) {
         expectTypeOf(data).toEqualTypeOf<any>()
      },
   }))
   let data1 = await upfetch('')
   expectTypeOf(data1).toEqualTypeOf<number>()

   let data2 = await upfetch('', {
      parseResponse: (res, options) => Promise.resolve(''),
   })
   expectTypeOf(data2).toEqualTypeOf<string>()

   let data3 = await upfetch('', () => ({
      parseResponse: (res, options) => Promise.resolve(''),
   }))
   expectTypeOf(data3).toEqualTypeOf<string>()

   let data4 = await upfetch('', (defaultOptions) => ({
      parseResponse: defaultOptions.parseResponse,
   }))
   expectTypeOf(data4).toEqualTypeOf<number>()

   let upfetch2 = up(fetch)

   let data5 = await upfetch2('')
   expectTypeOf(data5).toEqualTypeOf<any>()

   let data6 = await upfetch2('', {
      parseResponse: (res) => res,
   })
   expectTypeOf(data6).toEqualTypeOf<Response>()

   let data7 = await upfetch2('', {
      parseResponse: (res: any) => ({ res }),
      schema: v.object({
         res: v.string(),
      }),
   })
   expectTypeOf(data7).toEqualTypeOf<{ res: string }>()

   let data8 = await upfetch2('', {
      schema: z.number(),
   })
   expectTypeOf(data8).toEqualTypeOf<number>()

   let upfetch3 = up(fetch, () => ({
      parseResponse: () => 1,
   }))

   // Using currying
   let curried = () => (res: Response) => res.text()
   let data9 = await upfetch3('', {
      parseResponse: curried(),
      schema: v.pipe(
         v.string(),
         v.transform(() => '!' as const),
      ),
   })
   expectTypeOf(data9).toEqualTypeOf<'!'>()
})

test('The defaultSerializer of params should expect 1 arg only (the params)', async () => {
   let upfetch = up(fetch, () => ({
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
   let upfetch = up(fetch, () => ({
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
   let fetcher = (
      input: Parameters<typeof fetch>[0],
      init: Parameters<typeof fetch>[1] & { test?: number },
   ) => fetch(input, init)

   let upfetch = up(fetcher, () => ({
      onBeforeFetch(options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
      },
      onError(error, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(error).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
      },
      onSuccess(data, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(data).toEqualTypeOf<any>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
      },
      parseResponse(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
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
      schema: v.pipe(
         v.number(),
         v.transform((n) => String(n)),
      ),
      parseResponse(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
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
      schema: v.pipe(
         v.number(),
         v.transform((n) => String(n)),
      ),
      parseResponse(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
         return Promise.resolve(1)
      },
      parseResponseError(res, options) {
         expectTypeOf(options.test).toEqualTypeOf<number | undefined>()
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(options).toEqualTypeOf<ResolvedOptions<typeof fetcher>>()
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

test('When the fetcher options are functional, They should receive the fully infered defaultOptions as argument', () => {
   let defaultOptions = {
      parseResponse: () => Promise.resolve(1),
      parseResponseError: () => Promise.resolve(''),
      params: { a: 1, b: true },
      headers: { c: 2, d: 'false' },
   } as const

   let upfetch = up(fetch, () => defaultOptions)

   // @ts-expect-error type check dhould still work on the return type
   upfetch('', (defaultOptions) => {
      expectTypeOf(defaultOptions).toEqualTypeOf<typeof defaultOptions>()

      return { headers: '' } // This incorrect return type produces the error
   })
})

test('base fetch type should be extended', () => {
   type CustomFetchType = (
      input: RequestInfo | URL,
      init?: RequestInit & { additionalOption: string },
   ) => Promise<Response>
   let fetchFn: CustomFetchType = (() => {}) as any

   let upfetch = up(fetchFn, () => ({
      additionalOption: '1',
   }))

   upfetch('', { additionalOption: '' })
   // @ts-expect-error invalid type
   upfetch('', { additionalOption: 1 })

   upfetch('', (d) => ({ additionalOption: '' }))
   // @ts-expect-error invalid type
   upfetch('', (d) => ({ additionalOption: 1 }))
})

describe('up should accept a fetcher with', () => {
   test('narrower input', () => {
      type FetchFn = (
         input: string,
         options: Parameters<typeof fetch>[1],
      ) => Promise<Response>
      let fetchFn: FetchFn = (() => {}) as any
      let upfetch = up(fetchFn)
      upfetch('')
      // @ts-expect-error accept string only
      upfetch(new URL(''))
   })

   test('wider input', () => {
      type FetchFn = (
         input: string | URL | Request | number,
         options: Parameters<typeof fetch>[1],
      ) => Promise<Response>
      let fetchFn: FetchFn = (() => {}) as any
      let upfetch = up(fetchFn)
      upfetch('')
      upfetch(new Request(''))
      upfetch(new URL(''))
      upfetch(1)
   })

   test('narrower options', () => {
      type FetchFn = (
         input: Parameters<typeof fetch>[0],
         options: Omit<NonNullable<Parameters<typeof fetch>[1]>, 'cache'>,
      ) => Promise<Response>
      let fetchFn: FetchFn = (() => {}) as any
      let upfetch = up(fetchFn)
      upfetch('', { keepalive: true })
      // @ts-expect-error cache is not an option
      upfetch('', { cache: 'no-store' })
   })

   test('wider options', () => {
      type FetchFn = (
         input: Parameters<typeof fetch>[0],
         options: Parameters<typeof fetch>[1] & { newOption: string },
      ) => Promise<Response>
      let fetchFn: FetchFn = (() => {}) as any
      let upfetch = up(fetchFn)
      upfetch('', { baseUrl: '', keepalive: true, newOption: '' })
      // @ts-expect-error newOption is required
      upfetch('', { baseUrl: '', keepalive: true })
   })

   test('narrower args', () => {
      type FetchFn = (input: Parameters<typeof fetch>[0]) => Promise<Response>
      let fetchFn: FetchFn = (() => {}) as any
      fetchFn('')
      // @ts-expect-error accept one arg only
      fetchFn('', {})
   })

   test('wider args', () => {
      type FetchFn = (
         input: Parameters<typeof fetch>[0],
         options: Parameters<typeof fetch>[1],
         ctx: Record<string, string>,
      ) => Promise<Response>
      let fetchFn: FetchFn = (() => {}) as any
      let upfetch = up(fetchFn)
      upfetch('', {}, {})
      upfetch('', {})
      // @ts-expect-error invalid 3rd arg
      upfetch('', {}, '')
      // @ts-expect-error 3 args max
      upfetch('', {}, {}, '')
   })
})
