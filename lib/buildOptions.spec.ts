import { describe, expect, test } from 'vitest'
import { buildOptions, isJsonificable, mergeHeaders } from './buildOptions.js'

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
      defaultHeaders                                                               | fetcherHeaders                                                               | output
      ${{ 'Cache-Control': undefined }}                                            | ${undefined}                                                                 | ${{}}
      ${{ 'Cache-Control': undefined }}                                            | ${{ 'Cache-Control': undefined }}                                            | ${{}}
      ${{}}                                                                        | ${{ 'Cache-Control': undefined }}                                            | ${{}}
      ${new Headers({ 'Cache-Control': 'no-cache' })}                              | ${new Headers({ 'cache-Control': 'no-store' })}                              | ${{ 'cache-control': 'no-store' }}
      ${new Headers({ 'Cache-Control': 'no-cache', 'content-type': 'text/html' })} | ${new Headers({ 'cache-Control': 'no-store' })}                              | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
      ${new Headers({ 'Cache-Control': 'no-cache' })}                              | ${new Headers({ 'cache-Control': 'no-store', 'content-type': 'text/html' })} | ${{ 'cache-control': 'no-store', 'content-type': 'text/html' }}
   `('Input: $defaultHeaders, $fetcherHeaders', ({ defaultHeaders, fetcherHeaders, output }) => {
      const object: Record<string, string> = {}
      mergeHeaders(fetcherHeaders, defaultHeaders).forEach((value, key) => (object[key] = value))
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
      ${undefined}                                                         | ${''}
      ${null}                                                              | ${''}
      ${new SomeClass()}                                                   | ${'?a=1'}
   `('fallbackOptions.serializeParams: $input', ({ params, queryString }) => {
      expect(buildOptions({}, { params }).href).toBe(queryString)
   })
})

describe('href', () => {
   test.each`
      input                                                                  | output
      ${{ baseUrl: 'https://a.b.c' }}                                        | ${'https://a.b.c'}
      ${{ baseUrl: 'https://a.b.c', url: '/d' }}                             | ${'https://a.b.c/d'}
      ${{ baseUrl: 'https://a.b.c', url: '/d', params: 'q=q' }}              | ${'https://a.b.c/d?q=q'}
      ${{ baseUrl: 'https://a.b.c/', url: 'd', params: 'q=q' }}              | ${'https://a.b.c/d?q=q'}
      ${{ baseUrl: 'https://a.b.c/', url: 'd/', params: 'q=q' }}             | ${'https://a.b.c/d/?q=q'}
      ${{ baseUrl: 'https://a.b.c/e', url: '/d', params: 'q=q' }}            | ${'https://a.b.c/e/d?q=q'}
      ${{ baseUrl: 'https://a.b.c/e/', url: 'd', params: 'q=q' }}            | ${'https://a.b.c/e/d?q=q'}
      ${{ baseUrl: 'https://a.b.c/e/', url: 'd/', params: 'q=q' }}           | ${'https://a.b.c/e/d/?q=q'}
      ${{ baseUrl: 'https://a.b.c/e', url: '/d/', params: 'q=q' }}           | ${'https://a.b.c/e/d/?q=q'}
      ${{ url: '/a/b/c', params: { q: 'q' }, serializeParams: () => '1=2' }} | ${'/a/b/c?1=2'}
      ${{ url: 'a/b/c', params: { q: 'q' }, serializeParams: () => '1=2' }}  | ${'a/b/c?1=2'}
      ${{ url: 'a/b/c', params: 'q=q', serializeParams: () => '1=2' }}       | ${'a/b/c?q=q'}
      ${{ baseUrl: 'https://a.b.c', url: 'https://1.2.3', params: 'q=q' }}   | ${'https://1.2.3?q=q'}
      ${{ baseUrl: 'https://a.b.c', url: 'http:/https:', params: 'q=q' }}    | ${'https://a.b.chttp:/https:?q=q'}
   `('Input: $input', ({ input, output }) => {
      expect(buildOptions({}, input).href).toBe(output)
   })

   test('An empty fetchClient `baseUrl` should override the defaultOptions `baseUrl`', async () => {
      const options = buildOptions({ baseUrl: 'https://a.b.c' }, { baseUrl: '', url: '/a' })
      expect(options.url).toBe('/a')
   })
})

describe('options', () => {
   test('spreading the requestOptions should preserve the getters', async () => {
      const options = buildOptions(
         { baseUrl: 'http://a.b.c' },
         { headers: { Authorization: 'Bearer me' }, body: { hello: 'world' }, url: '/todos' },
      )
      expect(options.href).toEqual('http://a.b.c/todos')
      expect(options.body).toEqual('{"hello":"world"}')
      expect(options.headers.get('Authorization')).toEqual('Bearer me')

      const copy = { ...options }

      expect(copy.href).toEqual('http://a.b.c/todos')
      expect(copy.body).toEqual('{"hello":"world"}')
      expect(copy.headers.get('Authorization')).toEqual('Bearer me')
   })

   test('The `defaultOptions` should override the `fallbackOptions`', async () => {
      const retryDelay = () => 54321
      const retryWhen = () => true

      const options = buildOptions(
         {
            baseUrl: 'https://a.b.c',
            method: 'POST',
            headers: {
               'content-type': 'text/html',
            },
            cache: 'force-cache',
            credentials: 'omit',
            integrity: '123',
            keepalive: false,
            mode: 'same-origin',
            parseSuccess: (res) => res,
            redirect: 'follow',
            referrer: 'me',
            referrerPolicy: 'origin-when-cross-origin',
            retryDelay,
            retryTimes: 123,
            retryWhen,
            serializeBody: () => '123',
            serializeParams: () => 'a=b',
            window: null,
         },
         { params: {}, body: {} },
      )
      expect(options.href).toBe('https://a.b.c?a=b')
      expect(options.body).toEqual('123')
      expect(options.cache).toEqual('force-cache')
      expect(options.credentials).toEqual('omit')
      expect(options.integrity).toEqual('123')
      expect(options.keepalive).toEqual(false)
      expect(options.mode).toEqual('same-origin')
      expect(options.redirect).toEqual('follow')
      expect(options.referrer).toEqual('me')
      expect(options.referrerPolicy).toEqual('origin-when-cross-origin')
      expect(options.retryDelay).toEqual(retryDelay)
      expect(options.retryTimes).toEqual(123)
      expect(options.retryWhen).toEqual(retryWhen)
      expect(options.method).toEqual('POST')
      expect(options.window).toEqual(null)
      expect(options.headers.get('content-type')).toEqual('text/html')
   })

   test('the `fetchOptions` options should override `defaultOptions`', async () => {
      const serializeBody = (x: any) => x
      const serializeParams = (x: any) => x
      const parseSuccess = (s: any) => s as Promise<Response>
      const signal = 'upfetch signal' as any
      const retryDelay = () => 54321
      const retryWhen = () => true

      const options = buildOptions(
         {
            baseUrl: 'https://a.b.c',
            method: 'POST',
            headers: {
               'content-type': 'text/html',
            },
            cache: 'force-cache',
            credentials: 'omit',
            integrity: '123',
            keepalive: false,
            mode: 'same-origin',
            redirect: 'follow',
            referrer: 'me',
            referrerPolicy: 'origin-when-cross-origin',
            retryDelay: () => 1,
            retryTimes: 5,
            retryWhen: () => false,
            serializeBody: () => '123',
            serializeParams: () => '456',
            window: undefined,
            parseSuccess: () => Promise.resolve(321),
            signal: 'default signal' as any,
         },
         {
            baseUrl: 'https://1.2.3',
            body: { a: 1 },
            cache: 'no-store',
            credentials: 'include',
            integrity: '456',
            keepalive: true,
            mode: 'navigate',
            redirect: 'error',
            referrer: 'you',
            referrerPolicy: 'origin',
            headers: {
               'content-type': 'application/json',
            },
            method: 'DELETE',
            params: 'a=a',
            retryDelay,
            retryTimes: 123,
            retryWhen,
            serializeBody,
            serializeParams,
            signal,
            url: '/4/5',
            window: null,
            parseSuccess,
         },
      )

      expect(options.href).toBe('https://1.2.3/4/5?a=a')
      expect(options.body).toEqual({ a: 1 })
      expect(options.cache).toEqual('no-store')
      expect(options.credentials).toEqual('include')
      expect(options.integrity).toEqual('456')
      expect(options.keepalive).toEqual(true)
      expect(options.mode).toEqual('navigate')
      expect(options.redirect).toEqual('error')
      expect(options.referrer).toEqual('you')
      expect(options.referrerPolicy).toEqual('origin')
      expect(options.retryDelay).toEqual(retryDelay)
      expect(options.retryTimes).toEqual(123)
      expect(options.retryWhen).toEqual(retryWhen)
      expect(options.headers.get('content-type')).toEqual('application/json')
      expect(options.method).toEqual('DELETE')
      expect(options.signal).toEqual(signal)
      expect(options.window).toEqual(null)
      expect(options.parseSuccess).toEqual(parseSuccess)
   })
})

test.each`
   body
   ${{ a: 1 }}
   ${[1]}
`(
   'Header { content-type: application/json} should be applied automatically when no "content-type" header is present',
   async ({ body }) => {
      const options = buildOptions({}, { body })
      expect(options.headers.get('content-type')).toBe('application/json')
   },
)

test.each`
   body
   ${{ a: 1 }}
   ${[1]}
`(
   'Header { content-type: application/json} should NOT be applied automatically when a "content-type" header is present',
   async ({ body }) => {
      const options = buildOptions({ headers: { 'content-type': 'text/html' } }, { body })
      expect(options.headers.get('content-type')).toBe('text/html')
   },
)

test('If params is a string, serializeParams should not be called', async () => {
   const options = buildOptions(
      {},
      {
         params: 'a=1',
         serializeParams: () => 'a=b',
      },
   )
   expect(options.href).toBe('?a=1')
})

test('If body is a string, serializeBody should do nothing', async () => {
   const options = buildOptions(
      {},
      {
         body: '{"a":"b"}',
         serializeBody: () => '{"c":"d"}',
      },
   )
   expect(options.body).toBe('{"a":"b"}')
})
