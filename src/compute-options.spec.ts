import { describe, expect, test } from 'vitest'
import { computeOptions } from './compute-options'
import { bodyMock } from './_mocks'
import type { DefaultOptions, FetcherOptions } from './types'

describe('computeOptions input', () => {
   test.each`
      input                                 | defaultOptions                                 | fetcherOpts                             | output
      ${'/'}                                | ${{ baseUrl: 'http://a.b.c' }}                 | ${{}}                                   | ${'http://a.b.c/'}
      ${''}                                 | ${{ baseUrl: 'http://a.b.c' }}                 | ${{}}                                   | ${'http://a.b.c'}
      ${''}                                 | ${{ baseUrl: 'http://a.b.c/' }}                | ${{}}                                   | ${'http://a.b.c/'}
      ${''}                                 | ${{ baseUrl: '/' }}                            | ${{}}                                   | ${'/'}
      ${'/'}                                | ${{ baseUrl: '/' }}                            | ${{}}                                   | ${'/'}
      ${''}                                 | ${{ baseUrl: '' }}                             | ${{}}                                   | ${''}
      ${'d/e/f'}                            | ${{ baseUrl: 'http://a.b.c' }}                 | ${{}}                                   | ${'http://a.b.c/d/e/f'}
      ${'/'}                                | ${{ baseUrl: 'http://a.b.c/' }}                | ${{}}                                   | ${'http://a.b.c/'}
      ${'/'}                                | ${{ baseUrl: 'http://a.b.c/d' }}               | ${{}}                                   | ${'http://a.b.c/d/'}
      ${'/'}                                | ${{ baseUrl: 'http://a.b.c/d/' }}              | ${{}}                                   | ${'http://a.b.c/d/'}
      ${'b'}                                | ${{ baseUrl: 'http://a' }}                     | ${{}}                                   | ${'http://a/b'}
      ${'c'}                                | ${{ baseUrl: 'http://a/b' }}                   | ${{}}                                   | ${'http://a/b/c'}
      ${'http://d/e'}                       | ${{ baseUrl: 'http://a/b' }}                   | ${{}}                                   | ${'http://d/e'}
      ${''}                                 | ${{ baseUrl: 'http://a' }}                     | ${{}}                                   | ${'http://a'}
      ${'http://b'}                         | ${{ baseUrl: 'http://a' }}                     | ${{}}                                   | ${'http://b'}
      ${'http://b'}                         | ${{ baseUrl: 'http://a' }}                     | ${{ baseUrl: 'http://c' }}              | ${'http://b'}
      ${new URL('http://c/d')}              | ${{ baseUrl: 'http://a' }}                     | ${{}}                                   | ${'http://c/d'}
      ${new URL('http://c/d')}              | ${{ baseUrl: 'http://a/b' }}                   | ${{}}                                   | ${'http://c/d'}
      ${new URL('http://c/d?q=search')}     | ${{ baseUrl: 'http://a', params: { a: 'a' } }} | ${{}}                                   | ${'http://c/d?q=search&a=a'}
      ${new URL('http://c/d?q=search')}     | ${{ baseUrl: 'http://a?b=b' }}                 | ${{}}                                   | ${'http://c/d?q=search'}
      ${new Request('http://c/d')}          | ${{ baseUrl: 'http://a' }}                     | ${{}}                                   | ${undefined}
      ${new Request('http://c/d?q=search')} | ${{ baseUrl: 'http://a' }}                     | ${{}}                                   | ${undefined}
      ${'http://c/d?q=search'}              | ${{ baseUrl: 'http://a?b=b' }}                 | ${{}}                                   | ${'http://c/d?q=search'}
      ${'http://c/d?q=search'}              | ${{ params: { a: 'a', b: 'b' } }}              | ${{}}                                   | ${'http://c/d?q=search&a=a&b=b'}
      ${'http://c/d?q=search'}              | ${{ params: { a: 'a', b: 'b' } }}              | ${{ params: { a: 1, b: 2 } }}           | ${'http://c/d?q=search&a=1&b=2'}
      ${'http://c/d?q=search'}              | ${{ params: { q: 'query' } }}                  | ${{}}                                   | ${'http://c/d?q=search'}
      ${'http://c'}                         | ${{ params: { q: 'query' } }}                  | ${{}}                                   | ${'http://c?q=query'}
      ${'http://c'}                         | ${{}}                                          | ${{ params: { q: 'query' } }}           | ${'http://c?q=query'}
      ${'http://c'}                         | ${{ serializeParams: () => '?q=search' }}      | ${{ params: { q: 'will be ignored' } }} | ${'http://c?q=search'}
      ${'http://c/d'}                       | ${{ serializeParams: () => '?q=search' }}      | ${{ params: { q: 'will be ignored' } }} | ${'http://c/d?q=search'}
      ${'http://c/d?e=f'}                   | ${{ serializeParams: () => '?q=search' }}      | ${{ params: { q: 'will be ignored' } }} | ${'http://c/d?e=f&q=search'}
   `('Input: $body', ({ input, defaultOptions, fetcherOpts, output }) => {
      if (input instanceof Request) {
         expect(computeOptions(input, defaultOptions, fetcherOpts).input).toBe(
            input,
         )
      } else {
         expect(
            computeOptions(input, defaultOptions, fetcherOpts).input,
         ).toEqual(output)
      }
   })
})

describe('computeOptions body', () => {
   test.each`
      defaultOptions        | fetcherOpts                               | output
      ${{ body: { a: 1 } }} | ${{}}                                     | ${undefined}
      ${{}}                 | ${{ body: { a: 1 } }}                     | ${'{"a":1}'}
      ${{}}                 | ${{ body: bodyMock.buffer }}              | ${bodyMock.buffer}
      ${{}}                 | ${{ body: bodyMock.dataview }}            | ${bodyMock.dataview}
      ${{}}                 | ${{ body: bodyMock.blob }}                | ${bodyMock.blob}
      ${{}}                 | ${{ body: bodyMock.typedArray }}          | ${bodyMock.typedArray}
      ${{}}                 | ${{ body: bodyMock.formData }}            | ${bodyMock.formData}
      ${{}}                 | ${{ body: bodyMock.urlSearchParams }}     | ${bodyMock.urlSearchParams}
      ${{}}                 | ${{ body: bodyMock.stream }}              | ${bodyMock.stream}
      ${{}}                 | ${{ body: bodyMock.classNonJsonifiable }} | ${bodyMock.classNonJsonifiable}
      ${{}}                 | ${{ body: bodyMock.classJsonifiable }}    | ${'{"z":26}'}
      ${{}}                 | ${{ body: [1, 2] }}                       | ${'[1,2]'}
      ${{}}                 | ${{ body: '' }}                           | ${''}
      ${{}}                 | ${{ body: 0 }}                            | ${0}
      ${{}}                 | ${{ body: undefined }}                    | ${undefined}
      ${{}}                 | ${{ body: null }}                         | ${null}
   `('Input: $body', ({ defaultOptions, fetcherOpts, output }) => {
      const input = 'http://a'

      expect(computeOptions(input, defaultOptions, fetcherOpts).body).toEqual(
         output,
      )
   })
})

test('options overrides', () => {
   const defaultOptions: DefaultOptions<typeof fetch> = {
      baseUrl: 'https://a.b.c',
      cache: 'force-cache',
      credentials: 'include',
      headers: { a: 'b' },
      integrity: 'yeye',
      keepalive: true,
      method: 'PATCH',
      mode: 'navigate',
      params: { c: 'd' },
      parseResponse: () => {},
      parseResponseError: () => {},
      priority: 'high',
      redirect: 'follow',
      referrer: 'https://a.b.c',
      referrerPolicy: 'no-referrer-when-downgrade',
      signal: new AbortController().signal,
      throwResponseErrorWhen: () => true,
      window: null,
   }
   const fetcherOptions: FetcherOptions<typeof fetch> = {
      baseUrl: undefined,
      cache: undefined,
      credentials: undefined,
      integrity: undefined,
      keepalive: undefined,
      method: undefined,
      mode: undefined,
      priority: undefined,
      redirect: undefined,
      referrer: undefined,
      referrerPolicy: undefined,
      signal: undefined,
      window: undefined,
   }
   const computed = computeOptions('', defaultOptions, fetcherOptions)

   expect('baseUrl' in computed).toBeFalsy()
   expect('cache' in computed).toBeFalsy()
   expect('credentials' in computed).toBeFalsy()
   expect('integrity' in computed).toBeFalsy()
   expect('keepalive' in computed).toBeFalsy()
   expect('method' in computed).toBeFalsy()
   expect('mode' in computed).toBeFalsy()
   expect('priority' in computed).toBeFalsy()
   expect('redirect' in computed).toBeFalsy()
   expect('referrer' in computed).toBeFalsy()
   expect('referrerPolicy' in computed).toBeFalsy()
   expect('signal' in computed).toBeFalsy()
   expect('window' in computed).toBeFalsy()
})
