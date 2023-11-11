import { describe, expect, test } from 'vitest'
import { buildOptions } from './build-options.js'

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
      upOpts                | fetcherOpts                         | output
      ${{ body: { a: 1 } }} | ${{}}                               | ${undefined}
      ${{}}                 | ${{ body: { a: 1 } }}               | ${'{"a":1}'}
      ${{}}                 | ${{ body: buffer }}                 | ${buffer}
      ${{}}                 | ${{ body: dataview }}               | ${dataview}
      ${{}}                 | ${{ body: blob }}                   | ${blob}
      ${{}}                 | ${{ body: typedArray }}             | ${typedArray}
      ${{}}                 | ${{ body: formData }}               | ${formData}
      ${{}}                 | ${{ body: params }}                 | ${params}
      ${{}}                 | ${{ body: stream }}                 | ${stream}
      ${{}}                 | ${{ body: [1, 2] }}                 | ${'[1,2]'}
      ${{}}                 | ${{ body: '' }}                     | ${''}
      ${{}}                 | ${{ body: 0 }}                      | ${0}
      ${{}}                 | ${{ body: undefined }}              | ${undefined}
      ${{}}                 | ${{ body: null }}                   | ${null}
      ${{}}                 | ${{ body: new WillNotSerialize() }} | ${new WillNotSerialize()}
      ${{}}                 | ${{ body: new WillSerialize() }}    | ${'{"z":26}'}
   `('Input: $body', ({ upOpts, fetcherOpts, output }) => {
      const input = 'http://a'

      expect(buildOptions(input, upOpts, fetcherOpts).body).toEqual(output)
   })
})

describe('buildOptions merge options', () => {
   test('fetcherOpts.onError has no effect', () => {
      const upOpts = { onError: () => {} }
      const fetcherOpts = { onError: () => {} }
      // @ts-expect-error onError is not allowed on fetcherOpts
      const options = buildOptions('http://a', upOpts, fetcherOpts)
      expect(options.onError).toBe(upOpts.onError)
   })
   test('fetcherOpts.onSuccess has no effect', () => {
      const upOpts = { onSuccess: () => {} }
      const fetcherOpts = { onSuccess: () => {} }
      // @ts-expect-error onSuccess is not allowed on fetcherOpts
      const options = buildOptions('http://a', upOpts, fetcherOpts)
      expect(options.onSuccess).toBe(upOpts.onSuccess)
   })
   test('fetcherOpts.beforeFetch has no effect', () => {
      const upOpts = { beforeFetch: () => {} }
      const fetcherOpts = { beforeFetch: () => {} }
      // @ts-expect-error beforeFetch is not allowed on fetcherOpts
      const options = buildOptions('http://a', upOpts, fetcherOpts)
      expect(options.beforeFetch).toBe(upOpts.beforeFetch)
   })
   test('upOpts.body has no effect', () => {
      const upOpts = { body: { a: 1 } }
      const fetcherOpts = {}
      // @ts-expect-error body is not allowed on upOpts
      const options = buildOptions('http://a', upOpts, fetcherOpts)
      expect(options.body).toBeUndefined()
   })
})

class WillNotSerialize {
   a: number
   constructor() {
      this.a = 1
   }
}

class WillSerialize {
   toJSON() {
      return { z: 26 }
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
