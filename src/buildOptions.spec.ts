import { describe, expect, test } from 'vitest'
import { buildOptions, isJson, isJsonificable, mergeHeaders } from './buildOptions.js'

describe('isJson', () => {
   test.each`
      body           | output
      ${'a:1'}       | ${false}
      ${'a,1'}       | ${false}
      ${'{"a":1}'}   | ${true}
      ${'{a:1}'}     | ${false}
      ${'[1]'}       | ${true}
      ${'null'}      | ${false}
      ${'undefined'} | ${false}
      ${null}        | ${false}
      ${undefined}   | ${false}
      ${{ a: 1 }}    | ${false}
      ${{ a: 1 }}    | ${false}
      ${[1]}         | ${false}
   `('Input: $body', ({ body, output }) => {
      expect(isJson(body)).toEqual(output)
   })
})
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

describe('isJsonificable', () => {
   test.each`
      body                                | output
      ${new DataView(new ArrayBuffer(2))} | ${false}
      ${new Blob()}                       | ${false}
      ${new ArrayBuffer(2)}               | ${false}
      ${new FormData()}                   | ${false}
      ${new URLSearchParams({ q: 'q' })}  | ${false}
      ${{ q: 'q' }}                       | ${true}
      ${[1, 2]}                           | ${true}
      ${''}                               | ${false}
      ${0}                                | ${false}
      ${undefined}                        | ${false}
      ${null}                             | ${false}
      ${new Uint16Array(3)}               | ${false}
      ${new False()}                      | ${false}
      ${new True()}                       | ${true}
   `('Input: $body', ({ body, output }) => {
      expect(isJsonificable(body)).toEqual(output)
   })
})

describe('mergeHeaders', () => {
   test.each`
      defaultHeaders                                                               | requestHeaders                                                               | output
      ${{ 'Cache-Control': undefined }}                                            | ${undefined}                                                                 | ${{}}
      ${{ 'Cache-Control': undefined }}                                            | ${{ 'Cache-Control': undefined }}                                            | ${{}}
      ${{}}                                                                        | ${{ 'Cache-Control': undefined }}                                            | ${{}}
      ${new Headers({ 'Cache-Control': 'no-cache' })}                              | ${new Headers({ 'cache-Control': 'no-store' })}                              | ${{ 'cache-control': 'no-store' }}
      ${new Headers({ 'Cache-Control': 'no-cache', 'content-type': 'text/html' })} | ${new Headers({ 'cache-Control': 'no-store' })}                              | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${new Headers({ 'Cache-Control': 'no-cache' })}                              | ${new Headers({ 'cache-Control': 'no-store', 'content-type': 'text/html' })} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
   `('Input: $defaultHeaders, $requestHeaders', ({ defaultHeaders, requestHeaders, output }) => {
      const object: Record<string, string> = {}
      mergeHeaders(requestHeaders, defaultHeaders).forEach((value, key) => (object[key] = value))
      expect(object).toEqual(output)
   })
})

describe('serializeParams', () => {
   class SomeClass {
      a: number
      #z: number
      static e = 5

      constructor() {
         this.a = 1
         this.#z = -1
      }

      get b() {
         return 2
      }

      get z() {
         return this.#z
      }

      set c(v: number) {
         this.a = v
      }

      static d() {
         return 4
      }
   }

   test.each`
      params                                                               | queryString
      ${{ key1: true, key2: false }}                                       | ${'?key1=true&key2=false'}
      ${{ key1: 'value1', key2: 2, key3: undefined, key4: null }}          | ${'?key1=value1&key2=2&key4=null'}
      ${{ key5: '', key6: 0, key7: new Date('2023-02-15T13:46:35.046Z') }} | ${'?key5=&key6=0&key7=2023-02-15T13%3A46%3A35.046Z'}
      ${{ key5: { key: 'value' } }}                                        | ${'?key5=%5Bobject+Object%5D'}
      ${{ key5: ['string', 2, new Date('2023-02-15T13:46:35.046Z')] }}     | ${'?key5=string%2C2%2C2023-02-15T13%3A46%3A35.046Z'}
      ${{ key5: [true, false, null, undefined, 7] }}                       | ${'?key5=true%2Cfalse%2C%2C%2C7'}
      ${{ key5: [1, [2, true, null]] }}                                    | ${'?key5=1%2C2%2Ctrue%2C'}
      ${new SomeClass()}                                                   | ${'?a=1'}
   `('fallbackOptions.serializeParams: $input', ({ params, queryString }) => {
      expect(buildOptions({}, { params }).href).toBe(queryString)
   })
})

describe('href', () => {
   test.each`
      input                                                                        | output
      ${{ baseUrl: 'https://a.b.c' }}                                              | ${'https://a.b.c'}
      ${{ baseUrl: 'https://a.b.c', url: 'd' }}                                    | ${'https://a.b.c/d'}
      ${{ baseUrl: 'https://a.b.c', url: 'd', params: 'q=q' }}                     | ${'https://a.b.c/d?q=q'}
      ${{ baseUrl: 'https://a.b.c/', url: 'd', params: 'q=q' }}                    | ${'https://a.b.c/d?q=q'}
      ${{ baseUrl: 'https://a.b.c/', url: 'd/', params: 'q=q' }}                   | ${'https://a.b.c/d/?q=q'}
      ${{ baseUrl: 'https://a.b.c/e', url: 'd', params: 'q=q' }}                   | ${'https://a.b.c/e/d?q=q'}
      ${{ baseUrl: 'https://a.b.c/e/', url: 'd', params: 'q=q' }}                  | ${'https://a.b.c/e/d?q=q'}
      ${{ baseUrl: 'https://a.b.c/e/', url: 'd/', params: 'q=q' }}                 | ${'https://a.b.c/e/d/?q=q'}
      ${{ baseUrl: 'https://a.b.c/e/', url: '/d/', params: 'q=q' }}                | ${'https://a.b.c/e/d/?q=q'}
      ${{ baseUrl: 'https://a.b.c/e/', url: '/d/f', params: 'q=q' }}               | ${'https://a.b.c/e/d/f?q=q'}
      ${{ baseUrl: 'https://a.b.c/e/', url: '/d/f/', params: 'q=q' }}              | ${'https://a.b.c/e/d/f/?q=q'}
      ${{ baseUrl: new URL('https://a.b.c/e/'), url: '/d/f/', params: 'q=q' }}     | ${'https://a.b.c/e/d/f/?q=q'}
      ${{ baseUrl: new URL('https://a.b.c/e/?q=q'), url: '/d/f/', params: 'q=q' }} | ${'https://a.b.c/e/d/f/?q=q'}
      ${{ baseUrl: new URL('https://a.b.c/e'), url: '/d/f/', params: 'q=q' }}      | ${'https://a.b.c/e/d/f/?q=q'}
      ${{ baseUrl: new URL('http://a.b.c/e?q=q'), url: '/d/f/', params: 'q=q' }}   | ${'http://a.b.c/e/d/f/?q=q'}
      ${{ baseUrl: new URL('/d', 'http://a.b.c'), url: '/e/f/', params: 'q=q' }}   | ${'http://a.b.c/d/e/f/?q=q'}
      ${{ baseUrl: new URL('/d/e/f', 'http://a.b.c'), params: 'q=q' }}             | ${'http://a.b.c/d/e/f?q=q'}
      ${{ url: '/a/b/c', params: { q: 'q' }, serializeParams: () => '1=2' }}       | ${'/a/b/c?1=2'}
      ${{ url: 'a/b/c', params: { q: 'q' }, serializeParams: () => '1=2' }}        | ${'a/b/c?1=2'}
      ${{ url: 'a/b/c', params: 'q=q', serializeParams: () => '1=2' }}             | ${'a/b/c?q=q'}
      ${{ baseUrl: 'https://a.b.c', url: 'https://1.2.3', params: 'q=q' }}         | ${'https://1.2.3?q=q'}
      ${{ baseUrl: 'https://a.b.c', url: 'http:/https:', params: 'q=q' }}          | ${'https://a.b.c/http:/https:?q=q'}
   `('Input: $input', ({ input, output }) => {
      expect(buildOptions({}, input).href).toBe(output)
   })
})
