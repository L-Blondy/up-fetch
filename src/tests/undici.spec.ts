import { up } from 'src/up'
import { fetch } from 'undici'
import { test } from 'vitest'

const noop = (arg: any) => {}
/**
 * undici fetch is not compatible with up-fetch
 * because it uses its own Request API and does not accept
 * an input of globalThis.Request
 */
test('Should not accept undici fetch', () => {
   // @ts-expect-error not compatible
   const upfetch = up(fetch)
   noop(upfetch)
})
