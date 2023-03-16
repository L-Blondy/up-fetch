import { expect, test } from 'vitest'
import { buildUrl } from './buildUrl'
import { fallbackConfig } from './fallbackConfig'

test.each`
   input                                                                                           | output
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c' }}                                              | ${'https://a.b.c'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c', url: 'd' }}                                    | ${'https://a.b.c/d'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c', url: 'd', params: 'q=q' }}                     | ${'https://a.b.c/d?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c/', url: 'd', params: 'q=q' }}                    | ${'https://a.b.c/d?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c/', url: 'd/', params: 'q=q' }}                   | ${'https://a.b.c/d/?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c/e', url: 'd', params: 'q=q' }}                   | ${'https://a.b.c/e/d?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c/e/', url: 'd', params: 'q=q' }}                  | ${'https://a.b.c/e/d?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c/e/', url: 'd/', params: 'q=q' }}                 | ${'https://a.b.c/e/d/?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c/e/', url: '/d/', params: 'q=q' }}                | ${'https://a.b.c/e/d/?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c/e/', url: '/d/f', params: 'q=q' }}               | ${'https://a.b.c/e/d/f?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c/e/', url: '/d/f/', params: 'q=q' }}              | ${'https://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackConfig, baseUrl: new URL('https://a.b.c/e/'), url: '/d/f/', params: 'q=q' }}     | ${'https://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackConfig, baseUrl: new URL('https://a.b.c/e/?q=q'), url: '/d/f/', params: 'q=q' }} | ${'https://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackConfig, baseUrl: new URL('https://a.b.c/e'), url: '/d/f/', params: 'q=q' }}      | ${'https://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackConfig, baseUrl: new URL('http://a.b.c/e?q=q'), url: '/d/f/', params: 'q=q' }}   | ${'http://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackConfig, baseUrl: new URL('/d', 'http://a.b.c'), url: '/e/f/', params: 'q=q' }}   | ${'http://a.b.c/d/e/f/?q=q'}
   ${{ ...fallbackConfig, baseUrl: new URL('/d/e/f', 'http://a.b.c'), params: 'q=q' }}             | ${'http://a.b.c/d/e/f?q=q'}
   ${{ ...fallbackConfig, url: '/a/b/c', params: { q: 'q' }, serializeParams: () => '1=2' }}       | ${'/a/b/c?1=2'}
   ${{ ...fallbackConfig, url: 'a/b/c', params: { q: 'q' }, serializeParams: () => '1=2' }}        | ${'a/b/c?1=2'}
   ${{ ...fallbackConfig, url: 'a/b/c', params: 'q=q', serializeParams: () => '1=2' }}             | ${'a/b/c?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c', url: 'https://1.2.3', params: 'q=q' }}         | ${'https://1.2.3?q=q'}
   ${{ ...fallbackConfig, baseUrl: 'https://a.b.c', url: 'http:/https:', params: 'q=q' }}          | ${'https://a.b.c/http:/https:?q=q'}
`('Input: $input', ({ input, output }) => {
   expect(buildUrl(input)).toBe(output)
})
