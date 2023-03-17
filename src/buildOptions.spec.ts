import { expect, test } from 'vitest'
import { isJson, isJsonificable, mergeHeaders } from './buildOptions'

test.each`
   body           | output
   ${'a:1'}       | ${false}
   ${'a,1'}       | ${false}
   ${'{"a":1}'}   | ${true}
   ${'{a:1}'}     | ${false}
   ${'[1]'}       | ${true}
   ${'null'}      | ${false}
   ${'undefined'} | ${false}
`('Input: $body', ({ body, output }) => {
   expect(isJson(body)).toEqual(output)
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

test.each`
   body                                | isJson
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
`('Input: $body', ({ body, isJson }) => {
   expect(isJsonificable(body)).toEqual(isJson)
})

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
