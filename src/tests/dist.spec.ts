import { test } from 'vitest'
import { up } from '../../dist/index'

/**
 * @see https://github.com/L-Blondy/up-fetch/issues/43
 *
 * due to `declaration: true` in tsconfig.json
 */
export const upfetch = up(fetch)

test('placeholder', () => {})
