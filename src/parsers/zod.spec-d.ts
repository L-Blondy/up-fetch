import { up } from 'src/up'
import { expectTypeOf, test } from 'vitest'
import { withZod } from './zod'
import { z } from 'zod'

test('Infers output properly', async () => {
   const upfetch = up(fetch)

   const data1 = await upfetch('', {
      parseResponse: withZod(
         z.object({
            a: z.number(),
            b: z.string(),
         }),
      ),
   })

   expectTypeOf(data1).toEqualTypeOf<{
      a: number
      b: string
   }>()

   const data2 = await upfetch('', {
      parseResponse: withZod(
         z.object({
            a: z.number(),
            b: z.string().transform((x) => !!x),
         }),
      ),
   })

   expectTypeOf(data2).toEqualTypeOf<{
      a: number
      b: boolean
   }>()

   const data3 = await upfetch('', {
      parseResponse: withZod(z.string().email()),
   })

   expectTypeOf(data3).toEqualTypeOf<string>()
})
