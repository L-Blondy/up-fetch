/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, expect, test } from 'vitest'
import { resolveOptions } from './resolve-options'
import { bodyMock } from './_mocks'
import type { DefaultOptions, FetcherOptions } from './types'

describe('resolveOptions input', () => {
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
         expect(resolveOptions(input, defaultOptions, fetcherOpts).input).toBe(
            input,
         )
      } else {
         expect(
            resolveOptions(input, defaultOptions, fetcherOpts).input,
         ).toEqual(output)
      }
   })
})

describe('resolveOptions body', () => {
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
      let input = 'http://a'

      expect(resolveOptions(input, defaultOptions, fetcherOpts).body).toEqual(
         output,
      )
   })
})

test('options overrides', () => {
   let defaultOptions: DefaultOptions<typeof fetch, any, any> = {
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
      throwResponseError: () => true,
      window: null,
   }
   let fetcherOptions: FetcherOptions<typeof fetch, any, any, any> = {
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
   let resolved = resolveOptions('', defaultOptions, fetcherOptions)

   expect('baseUrl' in resolved).toBeFalsy()
   expect('cache' in resolved).toBeFalsy()
   expect('credentials' in resolved).toBeFalsy()
   expect('integrity' in resolved).toBeFalsy()
   expect('keepalive' in resolved).toBeFalsy()
   expect('method' in resolved).toBeFalsy()
   expect('mode' in resolved).toBeFalsy()
   expect('priority' in resolved).toBeFalsy()
   expect('redirect' in resolved).toBeFalsy()
   expect('referrer' in resolved).toBeFalsy()
   expect('referrerPolicy' in resolved).toBeFalsy()
   expect('signal' in resolved).toBeTruthy() // there is always a signal
   expect('window' in resolved).toBeFalsy()
})
