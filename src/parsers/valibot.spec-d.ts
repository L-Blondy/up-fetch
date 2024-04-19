import { up } from 'src/up.js'
import { expectTypeOf, test } from 'vitest'
import { withValibot } from './valibot.js'
import { email, number, object, string, transform } from 'valibot'

test('Infers output properly', async () => {
   const upfetch = up(fetch)

   const data1 = await upfetch('', {
      parseResponse: withValibot(
         object({
            a: number(),
            b: string(),
         }),
      ),
   })

   expectTypeOf(data1).toEqualTypeOf<{
      a: number
      b: string
   }>()

   const data2 = await upfetch('', {
      parseResponse: withValibot(
         object({
            a: number(),
            b: transform(string(), (x) => !!x),
         }),
      ),
   })

   expectTypeOf(data2).toEqualTypeOf<{
      a: number
      b: boolean
   }>()

   const data3 = await upfetch('', {
      parseResponse: withValibot(string([email()])),
   })

   expectTypeOf(data3).toEqualTypeOf<string>()
})
