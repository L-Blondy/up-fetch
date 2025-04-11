import { expectTypeOf, test } from 'vitest'
import { z } from 'zod'
import { up } from '../../dist'

/**
 * testing the build output with `declaration: true` in tsconfig.json
 *
 * @see https://github.com/L-Blondy/up-fetch/issues/43
 */
export const distUpfetch = up(fetch, () => ({
   parseResponse: Number,
   baseUrl: 'https://a.b.c',
}))

test('type inference should still work after the build', () => {
   function noop(...args: any) {}

   async function testCase() {
      const d1 = await distUpfetch('')
      expectTypeOf(d1).toEqualTypeOf<number>()
      const d2 = await distUpfetch('', {
         schema: z.number().transform(String),
      })
      expectTypeOf(d2).toEqualTypeOf<string>()
   }

   noop(testCase)
})
