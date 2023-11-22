import { describe, expect, test } from 'vitest'
import { buildOptions } from './build-options.js'
import { bodyMock } from './_mocks.js'

describe('buildOptions input', () => {
   test.each`
      input                                 | upOpts                            | fetcherOpts                   | output
      ${'b'}                                | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${'http://a/b'}
      ${''}                                 | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${'http://a/'}
      ${'http://b'}                         | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${'http://b/'}
      ${'http://b'}                         | ${{ baseUrl: 'http://a' }}        | ${{ baseUrl: 'http://c' }}    | ${'http://b/'}
      ${new URL('http://c/d')}              | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${'http://c/d'}
      ${new Request('http://c/d')}          | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${undefined}
      ${new Request('http://c/d?q=search')} | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${undefined}
      ${new URL('http://c/d?q=search')}     | ${{ baseUrl: 'http://a' }}        | ${{}}                         | ${'http://c/d?q=search'}
      ${new URL('http://c/d?q=search')}     | ${{ baseUrl: 'http://a?b=b' }}    | ${{}}                         | ${'http://c/d?q=search'}
      ${'http://c/d?q=search'}              | ${{ baseUrl: 'http://a?b=b' }}    | ${{}}                         | ${'http://c/d?q=search'}
      ${'http://c/d?q=search'}              | ${{ params: { a: 'a', b: 'b' } }} | ${{}}                         | ${'http://c/d?q=search&a=a&b=b'}
      ${'http://c/d?q=search'}              | ${{ params: { a: 'a', b: 'b' } }} | ${{ params: { a: 1, b: 2 } }} | ${'http://c/d?q=search&a=1&b=2'}
      ${'http://c/d?q=search'}              | ${{ params: { q: 'query' } }}     | ${{}}                         | ${'http://c/d?q=search'}
      ${'http://c'}                         | ${{ params: { q: 'query' } }}     | ${{}}                         | ${'http://c/?q=query'}
      ${'http://c'}                         | ${{}}                             | ${{ params: { q: 'query' } }} | ${'http://c/?q=query'}
   `('Input: $body', ({ input, upOpts, fetcherOpts, output }) => {
      if (input instanceof Request) {
         expect(buildOptions(input, upOpts, fetcherOpts).input).toBe(input)
      } else {
         expect(buildOptions(input, upOpts, fetcherOpts).input).toEqual(output)
      }
   })
})

describe('buildOptions body', () => {
   test.each`
      upOpts                | fetcherOpts                               | output
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
   `('Input: $body', ({ upOpts, fetcherOpts, output }) => {
      const input = 'http://a'

      expect(buildOptions(input, upOpts, fetcherOpts).body).toEqual(output)
   })
})
