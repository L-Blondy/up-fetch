import { expect, expectTypeOf, test } from 'vitest'
import { z } from 'zod'
import {
   isResponseValidationError,
   isValidationError,
   ResponseValidationError,
   up,
   ValidationError,
} from '../../dist'

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

test('legacy validation error exports should remain available after the build', () => {
   expect(ValidationError).toBe(ResponseValidationError)
   expect(isValidationError).toBe(isResponseValidationError)
   expectTypeOf<typeof ValidationError>().toEqualTypeOf<
      typeof ResponseValidationError
   >()
   expectTypeOf<typeof isValidationError>().toEqualTypeOf<
      typeof isResponseValidationError
   >()
})
