import { up } from 'src/up'
import { expectTypeOf, test } from 'vitest'
import { withTransform } from './transform'

test('Infers output properly', async () => {
   const upfetch = up(fetch)

   const data1 = await upfetch('', {
      parseResponse: withTransform((data, response) => {
         expectTypeOf(data).toEqualTypeOf<any>()
         expectTypeOf(response).toEqualTypeOf<Response>()
         return String(data)
      }),
   })

   expectTypeOf(data1).toEqualTypeOf<string>()

   const data2 = await upfetch('', {
      parseResponse: withTransform((data) => Promise.resolve(Number(data))),
   })

   expectTypeOf(data2).toEqualTypeOf<number>()

   const data3 = await upfetch('', {
      parseResponse: withTransform((data) => data),
   })

   expectTypeOf(data3).toEqualTypeOf<any>()

   const data4 = await upfetch('', {
      parseResponseError: withTransform((data, response) => {
         expectTypeOf(data).toEqualTypeOf<any>()
         expectTypeOf(response).toEqualTypeOf<Response>()
         return String(data)
      }),
   })
   expectTypeOf(data4).toEqualTypeOf<any>()
})
