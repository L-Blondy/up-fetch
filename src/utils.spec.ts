import { describe, expect, test } from 'vitest'
import {
   getUrlFromInput,
   isJsonificable,
   mergeHeaders,
   searchToObject,
   strip,
   withQuestionMark,
} from './utils.js'

class False {
   a: number
   constructor() {
      this.a = 1
   }
}

class True {
   toJSON() {
      return '{"z": 26}'
   }
}

const blob = new Blob([JSON.stringify({ hello: 'world' }, null, 2)], {
   type: 'application/json',
})
const buffer = new ArrayBuffer(8)
const typedArray = new Int32Array(buffer)
const dataview = new DataView(buffer).setInt16(0, 256, true /* littleEndian */)
const formData = new FormData()
formData.append('username', 'me')
const params = new URLSearchParams('foo=1&bar=2')
const stream = new ReadableStream({
   start(controller) {
      controller.enqueue('hello world')
   },
   pull() {},
   cancel() {},
})

describe('isJsonificable', () => {
   test.each`
      body           | output
      ${buffer}      | ${false}
      ${dataview}    | ${false}
      ${blob}        | ${false}
      ${typedArray}  | ${false}
      ${formData}    | ${false}
      ${params}      | ${false}
      ${stream}      | ${false}
      ${{ q: 'q' }}  | ${true}
      ${[1, 2]}      | ${true}
      ${''}          | ${false}
      ${0}           | ${false}
      ${undefined}   | ${false}
      ${null}        | ${false}
      ${new False()} | ${false}
      ${new True()}  | ${true}
   `('Input: $body', ({ body, output }) => {
      expect(isJsonificable(body)).toEqual(output)
   })
})

describe('mergeHeaders', () => {
   test.each`
      defaultHeaders                                                  | fetcherHeaders                                                  | output
      ${{ 'Cache-Control': undefined }}                               | ${undefined}                                                    | ${{}}
      ${{ 'Cache-Control': undefined }}                               | ${{ 'Cache-Control': undefined }}                               | ${{}}
      ${{}}                                                           | ${{ 'Cache-Control': undefined }}                               | ${{}}
      ${{ 'Cache-Control': '' }}                                      | ${{}}                                                           | ${{ 'cache-control': '' }}
      ${{ 'Cache-Control': '' }}                                      | ${{ 'Cache-Control': '' }}                                      | ${{ 'cache-control': '' }}
      ${{}}                                                           | ${{ 'Cache-Control': '' }}                                      | ${{ 'cache-control': '' }}
      ${{ 'Cache-Control': 'no-cache' }}                              | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store' }}
      ${{ 'Cache-Control': 'no-cache', 'content-type': 'text/html' }} | ${{ 'cache-Control': 'no-store' }}                              | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${{ 'Cache-Control': 'no-cache' }}                              | ${{ 'cache-Control': 'no-store', 'content-type': 'text/html' }} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
   `(
      'Input: $defaultHeaders, $fetcherHeaders',
      ({ defaultHeaders, fetcherHeaders, output }) => {
         expect(mergeHeaders(defaultHeaders, fetcherHeaders)).toEqual(output)
      },
   )
})

describe('searchToObject', () => {
   test.each`
      search             | output
      ${'a=b'}           | ${{ a: 'b' }}
      ${'?a=b'}          | ${{ a: 'b' }}
      ${'?a=b&c=1&d&e='} | ${{ a: 'b', c: '1', d: '', e: '' }}
      ${'a[i]=b[2]'}     | ${{ 'a[i]': 'b[2]' }}
   `('Input: $search', ({ search, output }) => {
      expect(searchToObject(search)).toEqual(output)
   })
})

describe('withQuestionMark', () => {
   test.each`
      str          | output
      ${'a=b'}     | ${'?a=b'}
      ${'?a=b'}    | ${'?a=b'}
      ${''}        | ${''}
      ${undefined} | ${''}
   `('Input: $str', ({ str, output }) => {
      expect(withQuestionMark(str)).toEqual(output)
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

describe('getUrlFromInput', () => {
   test.each`
      input                              | baseUrl            | output
      ${'d/'}                            | ${'https://a.b.c'} | ${new URL('https://a.b.c/d/')}
      ${'d'}                             | ${'https://a.b.c'} | ${new URL('https://a.b.c/d')}
      ${''}                              | ${'https://a.b.c'} | ${new URL('https://a.b.c/')}
      ${new URL('d/', 'https://a.b.c')}  | ${undefined}       | ${new URL('https://a.b.c/d/')}
      ${new URL('d', 'https://a.b.c')}   | ${undefined}       | ${new URL('https://a.b.c/d')}
      ${new URL('', 'https://a.b.c')}    | ${undefined}       | ${new URL('https://a.b.c/')}
      ${new Request('https://a.b.c/d/')} | ${undefined}       | ${new URL('https://a.b.c/d/')}
      ${new Request('https://a.b.c/d')}  | ${undefined}       | ${new URL('https://a.b.c/d')}
      ${new Request('https://a.b.c')}    | ${undefined}       | ${new URL('https://a.b.c/')}
   `('Input: $object', ({ input, baseUrl, output }) => {
      const url = getUrlFromInput(input, baseUrl)
      expect(url.host).toEqual(output.host)
      expect(url.hostname).toEqual(output.hostname)
      expect(url.href).toEqual(output.href)
      expect(url.origin).toEqual(output.origin)
      expect(url.pathname).toEqual(output.pathname)
      expect(url.port).toEqual(output.port)
      expect(url.search).toEqual(output.search)
      expect(url).toEqual(output)
   })
})
