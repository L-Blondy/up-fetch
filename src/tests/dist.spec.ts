import { up } from 'src/up'
import { test } from 'vitest'

/**
 * @see https://github.com/L-Blondy/up-fetch/issues/43
 *
 * due to `declaration: true` in tsconfig.json
 */
export const upfetch = up(fetch)

test('placeholder', () => {})
