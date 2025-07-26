import * as v from 'valibot'
import { describe, expectTypeOf, test } from 'vitest'
import { z } from 'zod'
import { up } from '..'
import { fallbackOptions } from '../fallback-options'
import type {
   DefaultRawBody,
   JsonifiableArray,
   JsonifiableObject,
} from '../types'

test('JsonifiableObject should support both types and interfaces', () => {
   interface Participant {
      id: string
      email: string
   }

   /**
    * 1 can pass while 2 fails
    */

   // 1
   const participant: Participant = {
      id: '1',
      email: 'whatever@gmail.com',
   } satisfies JsonifiableObject
   // 2
   participant satisfies JsonifiableObject
})

test('JsonifiableArray should support both types and interfaces', () => {
   interface Participant {
      id: string
      email: string
   }

   /**
    * 1 can pass while 2 fails
    */

   // 1
   const participants: Participant[] = [
      { id: '1', email: 'whatever@gmail.com' },
      { id: '2', email: 'whatever@gmail.com' },
   ] satisfies JsonifiableArray

   // 2
   participants satisfies JsonifiableArray
})

test('infer TData', async () => {
   const upfetch = up(fetch, () => ({
      parseResponse: (res, request) => Promise.resolve(1),
      onSuccess(data, request) {
         expectTypeOf(data).toEqualTypeOf<any>()
      },
   }))
   const data1 = await upfetch('')
   expectTypeOf(data1).toEqualTypeOf<number>()

   const data2 = await upfetch('', {
      parseResponse: (res, request) => Promise.resolve(''),
   })
   expectTypeOf(data2).toEqualTypeOf<string>()

   const upfetch2 = up(fetch)

   const data5 = await upfetch2('')
   expectTypeOf(data5).toEqualTypeOf<any>()

   const data6 = await upfetch2('', {
      parseResponse: (res) => res,
   })
   expectTypeOf(data6).toEqualTypeOf<Response>()

   const data7 = await upfetch2('', {
      parseResponse: (res: any) => ({ res }),
      schema: v.object({
         res: v.string(),
      }),
   })
   expectTypeOf(data7).toEqualTypeOf<{ res: string }>()

   const data8 = await upfetch2('', {
      schema: z.number(),
   })
   expectTypeOf(data8).toEqualTypeOf<number>()

   const upfetch3 = up(fetch, () => ({
      parseResponse: () => 1,
   }))

   // Using currying
   const curried = () => (res: Response) => res.text()
   const data9 = await upfetch3('', {
      parseResponse: curried(),
      schema: v.pipe(
         v.string(),
         v.transform(() => '!' as const),
      ),
   })
   expectTypeOf(data9).toEqualTypeOf<'!'>()
})

test('Infer body', () => {
   /**
    * Fallback body
    */
   type FallbackOkBody =
      | BodyInit
      | JsonifiableArray
      | JsonifiableObject
      | null
      | undefined
   const upfetch1_1 = up(fetch)
   const upfetch1_2 = up(fetch, () => ({}))
   upfetch1_1('', { body: {} as FallbackOkBody })
   upfetch1_2('', { body: {} as FallbackOkBody })
   // @ts-expect-error illegal type
   upfetch1_1('', { body: true })
   // @ts-expect-error illegal type
   upfetch1_2('', { body: true })
   // @ts-expect-error illegal type
   upfetch1_1('', { body: Symbol() })
   // @ts-expect-error illegal type
   upfetch1_2('', { body: Symbol() })
   /**
    * Default body
    */
   function serializeBody2(b: symbol) {
      return ''
   }
   const upfetch2 = up(fetch, () => ({
      serializeBody: serializeBody2,
      // this broke body's type inference, leave it here for the test
      serializeParams: (p) => '',
   }))
   upfetch2('', { body: {} as symbol | null | undefined })
   // @ts-expect-error illegal type
   upfetch2('', { body: true })
   // @ts-expect-error illegal type
   upfetch2('', { body: 1 })
   /**
    * Fetcher body
    */
   function serializeBody3(b: symbol) {
      return ''
   }
   const upfetch3 = up(fetch, () => ({ serializeBody: serializeBody3 }))
   upfetch3('', {
      serializeBody: (body: number) => '',
      body: {} as number | null | undefined,
   })
   upfetch3('', {
      // @ts-expect-error illegal type
      body: true,
      serializeBody: (body: number) => '',
   })
   upfetch3('', {
      // @ts-expect-error illegal type
      body: '',
      serializeBody: (body: number) => '',
   })
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
})

test('The defaultSerializer of body should expect 1 arg only (the body)', async () => {
   const upfetch = up(fetch, () => ({
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<DefaultRawBody>()
         return fallbackOptions.serializeBody(body)
      },
   }))

   await upfetch('', {
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<DefaultRawBody>()
         return fallbackOptions.serializeBody(body)
      },
   })
})

test('callback types', async () => {
   const fetcher = (
      input: Parameters<typeof fetch>[0],
      init: Parameters<typeof fetch>[1] & { test?: number },
   ) => fetch(input, init)

   const upfetch = up(fetcher, () => ({
      onRequest(request) {
         expectTypeOf(request).toEqualTypeOf<Request>()
      },
      onError(error, request) {
         expectTypeOf(error).toEqualTypeOf<unknown>()
         expectTypeOf(request).toEqualTypeOf<Request>()
      },
      onSuccess(data, request) {
         expectTypeOf(data).toEqualTypeOf<any>()
         expectTypeOf(request).toEqualTypeOf<Request>()
      },
      parseRejected(res, request) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(request).toEqualTypeOf<Request>()
         return Promise.resolve(true)
      },
      parseResponse(res, request) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(request).toEqualTypeOf<Request>()
         return Promise.resolve(1)
      },
      serializeParams(params) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         return ''
      },
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<DefaultRawBody>()
         return ''
      },
   }))

   await upfetch('', {
      schema: v.pipe(
         v.number(),
         v.transform((n) => String(n)),
      ),
      parseResponse(res, request) {
         expectTypeOf(res).toEqualTypeOf<Response>()
         expectTypeOf(request).toEqualTypeOf<Request>()
         return Promise.resolve(1)
      },
      serializeParams(params) {
         expectTypeOf(params).toEqualTypeOf<Record<string, any>>()
         return ''
      },
      serializeBody(body) {
         expectTypeOf(body).toEqualTypeOf<DefaultRawBody>()
         return ''
      },
   })
})

test('base fetch type should be extended', () => {
   type CustomFetchType = (
      input: RequestInfo | URL,
      init?: RequestInit & { additionalOption: string },
   ) => Promise<Response>
   const fetchFn: CustomFetchType = (() => {}) as any

   const upfetch = up(fetchFn, () => ({
      additionalOption: '1',
   }))

   upfetch('', { additionalOption: '' })
   // @ts-expect-error invalid type
   upfetch('', { additionalOption: 1 })
})

describe('up should accept a fetcher with', () => {
   test('wide input', () => {
      type FetchFn = (
         input: Request | string | URL,
         options: Parameters<typeof fetch>[1],
      ) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
      const upfetch = up(fetchFn)
      upfetch(new Request(''))
   })
   test('narrow input', () => {
      type FetchFn = (
         input: Request,
         options: Parameters<typeof fetch>[1],
      ) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
      const upfetch = up(fetchFn)
      upfetch(new Request(''))
      // @ts-expect-error accept string only
      upfetch(new URL(''))
   })

   test('narrower options', () => {
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

   test('wider options', () => {
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

   test('narrower args', () => {
      type FetchFn = (input: Parameters<typeof fetch>[0]) => Promise<Response>
      const fetchFn: FetchFn = (() => {}) as any
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

test('Should not need "as const"', () => {
   const upfetch1 = up(fetch, () => ({
      cache: 'default',
      credentials: 'include',
   }))

   upfetch1('', { credentials: 'include' })

   // @ts-expect-error invalid option value
   const upfetch2 = up(fetch, () => ({ credentials: '' }))

   // @ts-expect-error invalid option value
   upfetch2('', { credentials: 'includes' })
})
