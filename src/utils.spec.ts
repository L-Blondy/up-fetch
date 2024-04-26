import { describe, expect, test } from 'vitest'
import {
   isJsonifiableObjectOrArray,
   mergeHeaders,
   isRequest,
   strip,
   withPrefix,
   buildParams,
} from './utils'
import { bodyMock } from './_mocks'

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
      expect(isJsonifiableObjectOrArray(body)).toEqual(output)
   })
})

describe('mergeHeaders', () => {
   test.each`
      defaultHeaders                                                                 | fetcherHeaders                                                  | output
      ${{ 'Cache-Control': undefined }}                                              | ${undefined}                                                    | ${{}}
      ${{ 'Cache-Control': undefined }}                                              | ${{ 'Cache-Control': undefined }}                               | ${{}}
      ${{}}                                                                          | ${{ 'Cache-Control': undefined }}                               | ${{}}
      ${{ 'Cache-Control': 'no-cache' }}                                             | ${{ 'Cache-Control': undefined }}                               | ${{}}
      ${{ 'Cache-Control': '' }}                                                     | ${{}}                                                           | ${{ 'cache-control': '' }}
      ${{ 'Cache-Control': '' }}                                                     | ${{ 'Cache-Control': '' }}                                      | ${{ 'cache-control': '' }}
      ${{}}                                                                          | ${{ 'Cache-Control': '' }}                                      | ${{ 'cache-control': '' }}
      ${{ 'Cache-Control': 'no-cache' }}                                             | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store' }}
      ${{ 'Cache-Control': 'no-cache', 'content-type': 'text/html' }}                | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${{ 'Cache-Control': 'no-cache' }}                                             | ${{ 'cache-Control': 'no-store', 'content-type': 'text/html' }} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${[['Cache-Control', 'no-cache'], ['content-type', 'text/html']]}              | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${[['Cache-Control', 'no-cache']]}                                             | ${{ 'cache-Control': 'no-store', 'content-type': 'text/html' }} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${new Headers([['Cache-Control', 'no-cache'], ['content-type', 'text/html']])} | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${new Headers([['Cache-Control', 'no-cache']])}                                | ${{ 'cache-Control': 'no-store', 'content-type': 'text/html' }} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${undefined}                                                                   | ${undefined}                                                    | ${{}}
   `(
      'Input: $defaultHeaders, $fetcherHeaders',
      ({ defaultHeaders, fetcherHeaders, output }) => {
         expect(mergeHeaders(defaultHeaders, fetcherHeaders)).toEqual(output)
      },
   )
})

describe('buildParams', () => {
   test.each`
      defaultParams | input                      | fetcherParams | output
      ${{ a: 1 }}   | ${''}                      | ${{ a: 2 }}   | ${{ a: 2 }}
      ${{ a: 1 }}   | ${'url?a=2'}               | ${{}}         | ${{}}
      ${{ a: 1 }}   | ${'url?a=2'}               | ${{ a: 2 }}   | ${{ a: 2 }}
      ${{ a: 1 }}   | ${'url?b=2'}               | ${{}}         | ${{ a: 1 }}
      ${{ a: 1 }}   | ${new Request('http://a')} | ${{ a: 2 }}   | ${{}}
   `(
      'Input: $defaultHeaders, $fetcherHeaders',
      ({ defaultParams, input, fetcherParams, output }) => {
         expect(buildParams(defaultParams, input, fetcherParams)).toEqual(
            output,
         )
      },
   )
})

describe('withPrefix', () => {
   test.each`
      str          | output
      ${'a=b'}     | ${'?a=b'}
      ${'?a=b'}    | ${'?a=b'}
      ${''}        | ${''}
      ${undefined} | ${''}
   `('Input: $str', ({ str, output }) => {
      expect(withPrefix('?', str)).toEqual(output)
   })
})

describe('strip', () => {
   test.each`
      object                      | keys          | output
      ${{ a: 1, b: undefined }}   | ${[]}         | ${{ a: 1 }}
      ${{ a: 1, b: 'c', d: 'e' }} | ${['b', 'd']} | ${{ a: 1 }}
   `('Input: $object', ({ object, keys, output }) => {
      const stripped = strip(object, keys)
      expect(stripped).toEqual(output)
      Object.values(stripped).forEach((value) =>
         expect(value).not.toBeUndefined(),
      )
   })
})

describe('isInputRequest', () => {
   test.each`
      input                          | output
      ${new Request('http://a.b.c')} | ${true}
      ${new URL('http://a.b.c')}     | ${false}
      ${'http://a.b.c'}              | ${false}
   `('Input: $object', ({ input, baseUrl, output }) => {
      expect(isRequest(input)).toEqual(output)
   })
})
