import { test } from 'vitest'
import { up } from '../../dist/index'

/**
 * @see https://github.com/L-Blondy/up-fetch/issues/43
 *
 * due to `declaration: true` in tsconfig.json
 */

// biome-ignore lint/suspicious/noExportsInTest:
export const upfetch = up(fetch)

test('placeholder', () => {})
