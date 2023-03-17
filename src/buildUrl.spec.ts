import { expect, test } from 'vitest'
import { buildUrl } from './buildUrl'
import { fallbackOptions } from './fallbackOptions'

test.each`
   input                                                                                            | output
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c' }}                                              | ${'https://a.b.c'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c', url: 'd' }}                                    | ${'https://a.b.c/d'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c', url: 'd', params: 'q=q' }}                     | ${'https://a.b.c/d?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c/', url: 'd', params: 'q=q' }}                    | ${'https://a.b.c/d?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c/', url: 'd/', params: 'q=q' }}                   | ${'https://a.b.c/d/?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c/e', url: 'd', params: 'q=q' }}                   | ${'https://a.b.c/e/d?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c/e/', url: 'd', params: 'q=q' }}                  | ${'https://a.b.c/e/d?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c/e/', url: 'd/', params: 'q=q' }}                 | ${'https://a.b.c/e/d/?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c/e/', url: '/d/', params: 'q=q' }}                | ${'https://a.b.c/e/d/?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c/e/', url: '/d/f', params: 'q=q' }}               | ${'https://a.b.c/e/d/f?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c/e/', url: '/d/f/', params: 'q=q' }}              | ${'https://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackOptions, baseUrl: new URL('https://a.b.c/e/'), url: '/d/f/', params: 'q=q' }}     | ${'https://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackOptions, baseUrl: new URL('https://a.b.c/e/?q=q'), url: '/d/f/', params: 'q=q' }} | ${'https://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackOptions, baseUrl: new URL('https://a.b.c/e'), url: '/d/f/', params: 'q=q' }}      | ${'https://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackOptions, baseUrl: new URL('http://a.b.c/e?q=q'), url: '/d/f/', params: 'q=q' }}   | ${'http://a.b.c/e/d/f/?q=q'}
   ${{ ...fallbackOptions, baseUrl: new URL('/d', 'http://a.b.c'), url: '/e/f/', params: 'q=q' }}   | ${'http://a.b.c/d/e/f/?q=q'}
   ${{ ...fallbackOptions, baseUrl: new URL('/d/e/f', 'http://a.b.c'), params: 'q=q' }}             | ${'http://a.b.c/d/e/f?q=q'}
   ${{ ...fallbackOptions, url: '/a/b/c', params: { q: 'q' }, serializeParams: () => '1=2' }}       | ${'/a/b/c?1=2'}
   ${{ ...fallbackOptions, url: 'a/b/c', params: { q: 'q' }, serializeParams: () => '1=2' }}        | ${'a/b/c?1=2'}
   ${{ ...fallbackOptions, url: 'a/b/c', params: 'q=q', serializeParams: () => '1=2' }}             | ${'a/b/c?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c', url: 'https://1.2.3', params: 'q=q' }}         | ${'https://1.2.3?q=q'}
   ${{ ...fallbackOptions, baseUrl: 'https://a.b.c', url: 'http:/https:', params: 'q=q' }}          | ${'https://a.b.c/http:/https:?q=q'}
`('Input: $input', ({ input, output }) => {
   expect(buildUrl(input)).toBe(output)
})
