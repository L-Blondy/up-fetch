import { describe, expect, test } from 'vitest'
import { bodyMock } from './_mocks'
import {
   isJsonifiable,
   mergeHeaders,
   omit,
   resolveInput,
   resolveParams,
} from './utils'

describe('isJsonifiableObjectOrArray', () => {
   test.each`
      body                            | output
      ${bodyMock.buffer}              | ${false}
      ${bodyMock.dataview}            | ${false}
      ${bodyMock.blob}                | ${false}
      ${bodyMock.typedArray}          | ${false}
      ${bodyMock.formData}            | ${false}
      ${bodyMock.urlSearchParams}     | ${false}
      ${bodyMock.stream}              | ${false}
      ${bodyMock.classNonJsonifiable} | ${false}
      ${bodyMock.classJsonifiable}    | ${true}
      ${{ q: 'q' }}                   | ${true}
      ${[1, 2]}                       | ${true}
      ${''}                           | ${false}
      ${0}                            | ${false}
      ${undefined}                    | ${false}
      ${null}                         | ${false}
   `('Input: $body', ({ body, output }) => {
      expect(isJsonifiable(body)).toEqual(output)
   })
})

describe('mergeHeaders', () => {
   test.each`
      defaultHeaders                                                    | fetcherHeaders                                                  | output
      ${{ 'Cache-Control': undefined }}                                 | ${undefined}                                                    | ${{}}
      ${{ 'Cache-Control': undefined }}                                 | ${{ 'Cache-Control': undefined }}                               | ${{}}
      ${{}}                                                             | ${{ 'Cache-Control': undefined }}                               | ${{}}
      ${{ 'Cache-Control': 'no-cache' }}                                | ${{ 'Cache-Control': undefined }}                               | ${{}}
      ${{ 'Cache-Control': '' }}                                        | ${{}}                                                           | ${{ 'cache-control': '' }}
      ${{ 'Cache-Control': '' }}                                        | ${{ 'Cache-Control': '' }}                                      | ${{ 'cache-control': '' }}
      ${{}}                                                             | ${{ 'Cache-Control': '' }}                                      | ${{ 'cache-control': '' }}
      ${{ 'Cache-Control': 'no-cache' }}                                | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store' }}
      ${{ 'Cache-Control': 'no-cache', 'content-type': 'text/html' }}   | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${{ 'Cache-Control': 'no-cache' }}                                | ${{ 'cache-Control': 'no-store', 'content-type': 'text/html' }} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${[['Cache-Control', 'no-cache'], ['content-type', 'text/html']]} | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${[['Cache-Control', 'no-cache']]}                                | ${{ 'cache-Control': 'no-store', 'content-type': 'text/html' }} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${new Headers([['Cache-Control', 'no-cache'], ['content-type', 'text/html']])} | ${{ 'cache-Control': 'no-store' }} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${new Headers([['Cache-Control', 'no-cache']])}                   | ${{ 'cache-Control': 'no-store', 'content-type': 'text/html' }} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${undefined}                                                      | ${undefined}                                                    | ${{}}
   `(
      'Input: $defaultHeaders, $fetcherHeaders',
      ({ defaultHeaders, fetcherHeaders, output }) => {
         expect(mergeHeaders(defaultHeaders, fetcherHeaders)).toEqual(output)
      },
   )
})

describe('resolveParams', () => {
   test.each`
      defaultParams | input                      | fetcherParams | output
      ${{ a: 1 }}   | ${''}                      | ${{ a: 2 }}   | ${{ a: 2 }}
      ${{ a: 1 }}   | ${'url?a=2'}               | ${{}}         | ${{}}
      ${{ a: 1 }}   | ${'url?a=2'}               | ${{ a: 2 }}   | ${{ a: 2 }}
      ${{ a: 1 }}   | ${'url?b=2'}               | ${{}}         | ${{ a: 1 }}
      ${{ a: 1 }}   | ${new Request('http://a')} | ${{ a: 2 }}   | ${{}}
      ${{ a: 1 }}   | ${new URL('http://a')}     | ${{ a: 2 }}   | ${{}}
   `(
      'Input: $defaultHeaders, $fetcherHeaders',
      ({ defaultParams, input, fetcherParams, output }) => {
         expect(resolveParams(defaultParams, input, fetcherParams)).toEqual(
            output,
         )
      },
   )
})

describe('strip', () => {
   test.each`
      object                      | keys          | output
      ${{ a: 1, b: undefined }}   | ${[]}         | ${{ a: 1, b: undefined }}
      ${{ a: 1, b: 'c', d: 'e' }} | ${['b', 'd']} | ${{ a: 1 }}
   `('Input: $object', ({ object, keys, output }) => {
      const stripped = omit(object, keys)
      expect(stripped).toEqual(output)
   })
})

describe('resolveInput', () => {
   test.each`
      baseUrl              | input                                 | queryString   | output
      ${'http://a.b.c'}    | ${'/'}                                | ${''}         | ${'http://a.b.c/'}
      ${'http://a.b.c'}    | ${''}                                 | ${''}         | ${'http://a.b.c'}
      ${'http://a.b.c/'}   | ${''}                                 | ${''}         | ${'http://a.b.c/'}
      ${'/'}               | ${''}                                 | ${''}         | ${'/'}
      ${'/'}               | ${'/'}                                | ${''}         | ${'/'}
      ${''}                | ${''}                                 | ${''}         | ${''}
      ${'http://a.b.c'}    | ${'d/e/f'}                            | ${''}         | ${'http://a.b.c/d/e/f'}
      ${'http://a.b.c/'}   | ${'/'}                                | ${''}         | ${'http://a.b.c/'}
      ${'http://a.b.c/d'}  | ${'/'}                                | ${''}         | ${'http://a.b.c/d/'}
      ${'http://a.b.c/d/'} | ${'/'}                                | ${''}         | ${'http://a.b.c/d/'}
      ${'http://a'}        | ${'b'}                                | ${''}         | ${'http://a/b'}
      ${'http://a/b'}      | ${'c'}                                | ${''}         | ${'http://a/b/c'}
      ${'http://a/b'}      | ${'http://d/e'}                       | ${''}         | ${'http://d/e'}
      ${'http://a'}        | ${''}                                 | ${''}         | ${'http://a'}
      ${'http://a'}        | ${'http://b'}                         | ${''}         | ${'http://b'}
      ${'http://a'}        | ${'http://b'}                         | ${''}         | ${'http://b'}
      ${'http://a'}        | ${new URL('http://c/d')}              | ${''}         | ${'http://c/d'}
      ${'http://a/b'}      | ${new URL('http://c/d')}              | ${''}         | ${'http://c/d'}
      ${'http://a'}        | ${new URL('http://c/d?q=search')}     | ${'?a=a'}     | ${'http://c/d?q=search&a=a'}
      ${'http://a?b=b'}    | ${new URL('http://c/d?q=search')}     | ${''}         | ${'http://c/d?q=search'}
      ${'http://a'}        | ${new Request('http://c/d')}          | ${''}         | ${undefined}
      ${'http://a'}        | ${new Request('http://c/d?q=search')} | ${''}         | ${undefined}
      ${'http://a?b=b'}    | ${'http://c/d?q=search'}              | ${''}         | ${'http://c/d?q=search'}
      ${undefined}         | ${'http://c/d?q=search'}              | ${'a=a&b=b'}  | ${'http://c/d?q=search&a=a&b=b'}
      ${''}                | ${'http://c/d?q=search'}              | ${'a=1&b=2'}  | ${'http://c/d?q=search&a=1&b=2'}
      ${''}                | ${'http://c/d?q=search'}              | ${'?a=1&b=2'} | ${'http://c/d?q=search&a=1&b=2'}
      ${undefined}         | ${'http://c/d?q=search'}              | ${''}         | ${'http://c/d?q=search'}
      ${''}                | ${'http://c'}                         | ${'q=query'}  | ${'http://c?q=query'}
      ${undefined}         | ${'http://c'}                         | ${'?q=query'} | ${'http://c?q=query'}
   `(
      'resolveInput: $baseUrl $input',
      ({ baseUrl, input, queryString, output }) => {
         if (input instanceof Request) {
            expect(resolveInput(baseUrl, input, queryString)).toStrictEqual(
               input,
            )
         } else {
            expect(resolveInput(baseUrl, input, queryString)).toStrictEqual(
               output,
            )
         }
      },
   )
})
