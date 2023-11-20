/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { up } from './up.js'

//  upfetch1().then((data) => {
//     expectTypeOf(data).toEqualTypeOf<{ a: number; b: number }>()
//  })

// const options = buildOptions(
// 	'',
// 	{
// 		 parseResponse: (res, opts) => res.text(),
// 		 parseResponseError: (res, opts) => res.text(),
// 		 serializeParams(params, options, defaultSerializer) {
// 				return ''
// 		 },
// 		 serializeBody(body, options, defaultSerializer) {
// 				return ''
// 		 },
// 	},
// 	{
// 		 parseResponse: (res, opts) => Promise.resolve(1),
// 		 parseResponseError: (res, opts) => Promise.resolve(1),
// 		 serializeParams(params, options, defaultSerializer) {
// 				return ''
// 		 },
// 		 serializeBody(body, options, defaultSerializer) {
// 				return ''
// 		 },
// 	},
// )
// type w = (typeof options)['parseResponse']
// //   ^?
// type x = (typeof options)['parseResponseError']
// //   ^?
// type h = (typeof options)['headers']

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
