import { describe, expect, test } from 'vitest'
import { buildOptions } from './build-options'
import { bodyMock } from './_mocks'

describe('buildOptions input', () => {
   test.each`
      input                                 | defaultOptions                    | fetcherOpts                   | output
      ${'/'}                                | ${{ baseUrl: 'http://a.b.c' }}    | ${{}}                         | ${'http://a.b.c/'}
      ${''}                                 | ${{ baseUrl: 'http://a.b.c' }}    | ${{}}                         | ${'http://a.b.c'}
      ${''}                                 | ${{ baseUrl: 'http://a.b.c/' }}   | ${{}}                         | ${'http://a.b.c/'}
      ${''}                                 | ${{ baseUrl: '/' }}               | ${{}}                         | ${'/'}
      ${'/'}                                | ${{ baseUrl: '/' }}               | ${{}}                         | ${'/'}
      ${''}                                 | ${{ baseUrl: '' }}                | ${{}}                         | ${''}
      ${'d/e/f'}                            | ${{ baseUrl: 'http://a.b.c' }}    | ${{}}                         | ${'http://a.b.c/d/e/f'}
      ${'/'}                                | ${{ baseUrl: 'http://a.b.c/' }}   | ${{}}                         | ${'http://a.b.c/'}
      ${'/'}                                | ${{ baseUrl: 'http://a.b.c/d' }}  | ${{}}                         | ${'http://a.b.c/d/'}
      ${'/'}                                | ${{ baseUrl: 'http://a.b.c/d/' }} | ${{}}                         | ${'http://a.b.c/d/'}
      ${'b'}                                | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${'http://a/b'}
      ${'c'}                                | ${{ baseUrl: 'http://a/b' }}      | ${{}}                         | ${'http://a/b/c'}
      ${'http://d/e'}                       | ${{ baseUrl: 'http://a/b' }}      | ${{}}                         | ${'http://d/e'}
      ${''}                                 | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${'http://a'}
      ${'http://b'}                         | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${'http://b'}
      ${'http://b'}                         | ${{ baseUrl: 'http://a' }}        | ${{ baseUrl: 'http://c' }}    | ${'http://b'}
      ${new URL('http://c/d')}              | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${undefined}
      ${new URL('http://c/d')}              | ${{ baseUrl: 'http://a/b' }}      | ${{}}                         | ${undefined}
      ${new Request('http://c/d')}          | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${undefined}
      ${new Request('http://c/d?q=search')} | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${undefined}
      ${new URL('http://c/d?q=search')}     | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${undefined}
      ${new URL('http://c/d?q=search')}     | ${{ baseUrl: 'http://a?b=b' }}    | ${{}}                         | ${undefined}
      ${'http://c/d?q=search'}              | ${{ baseUrl: 'http://a?b=b' }}    | ${{}}                         | ${'http://c/d?q=search'}
      ${'http://c/d?q=search'}              | ${{ params: { a: 'a', b: 'b' } }} | ${{}}                         | ${'http://c/d?q=search&a=a&b=b'}
      ${'http://c/d?q=search'}              | ${{ params: { a: 'a', b: 'b' } }} | ${{ params: { a: 1, b: 2 } }} | ${'http://c/d?q=search&a=1&b=2'}
      ${'http://c/d?q=search'}              | ${{ params: { q: 'query' } }}     | ${{}}                         | ${'http://c/d?q=search'}
      ${'http://c'}                         | ${{ params: { q: 'query' } }}     | ${{}}                         | ${'http://c?q=query'}
      ${'http://c'}                         | ${{}}                             | ${{ params: { q: 'query' } }} | ${'http://c?q=query'}
      ${'http://c'}                         | ${{ serializeParams : () => '?q=search' }}                             | ${{ params: { q: 'will be ignored' } }} | ${'http://c?q=search'}
      ${'http://c/d'}                         | ${{ serializeParams : () => '?q=search' }}                             | ${{ params: { q: 'will be ignored' } }} | ${'http://c/d?q=search'}
   `('Input: $body', ({ input, defaultOptions, fetcherOpts, output }) => {
      if (input instanceof Request || input instanceof URL) {
         expect(buildOptions(input, defaultOptions, fetcherOpts).input).toBe(
            input,
         )
      } else {
         expect(buildOptions(input, defaultOptions, fetcherOpts).input).toEqual(
            output,
         )
      }
   })
})

describe('buildOptions body', () => {
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

      expect(buildOptions(input, defaultOptions, fetcherOpts).body).toEqual(
         output,
      )
   })
})
