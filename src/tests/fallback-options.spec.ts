import { describe, expect, test } from 'vitest'
import { fallbackOptions } from '../fallback-options'
import { ResponseError } from '../response-error'

/**
 * These tests assert the current default behaviors of the fallback options.
 */

describe('serializeParams', () => {
   test.each`
      params                                                               | output
      ${{ key1: true, key2: false }}                                       | ${'key1=true&key2=false'}
      ${{ key1: 'value1', key2: 2, key3: undefined, key4: null }}          | ${'key1=value1&key2=2&key4=null'}
      ${{ key5: '', key6: 0, key7: new Date('2023-02-15T13:46:35.046Z') }} | ${'key5=&key6=0&key7=2023-02-15T13%3A46%3A35.046Z'}
      ${{ key5: { key: 'value' } }}                                        | ${'key5=%5Bobject+Object%5D'}
      ${{ key5: ['string', 2, new Date('2023-02-15T13:46:35.046Z')] }}     | ${'key5=string%2C2%2C2023-02-15T13%3A46%3A35.046Z'}
      ${{ key5: [true, false, null, undefined, 7] }}                       | ${'key5=true%2Cfalse%2C%2C%2C7'}
      ${{ key5: [1, [2, true, null]] }}                                    | ${'key5=1%2C2%2Ctrue%2C'}
      ${{ key5: { a: 1 } }}                                                | ${'key5=%5Bobject+Object%5D' /** does not support nested objects */}
   `('%#', ({ params, output }) => {
      expect(fallbackOptions.serializeParams(params)).toBe(output)
   })
})

describe('serializeBody', () => {
   // it is just a JSON.stringify, no test required
   test('serializeBody', () => {})
})

describe('parseResponse', () => {
   test.each`
      response                                                                                                                           | output
      ${new Response('{ "a": true, "b": false, "c":"aaa", "d":1 }', { headers: { 'Content-type': 'application/json; charset=utf-8' } })} | ${{ a: true, b: false, c: 'aaa', d: 1 }}
      ${new Response(null)}                                                                                                              | ${null}
      ${new Response()}                                                                                                                  | ${null}
      ${new Response('')}                                                                                                                | ${null}
      ${new Response('<h1>Some text</h1>')}                                                                                              | ${'<h1>Some text</h1>'}
   `('%#', async ({ response, output }) => {
      expect(
         await fallbackOptions.parseResponse(response, {} as any),
      ).toStrictEqual(output)
   })
})

describe('parseRejected', () => {
   test.each`
      response                                                                                                            | output
      ${new Response('{ "a": true, "b": false, "c":"aaa", "d":1 }', { headers: { 'Content-type': 'application/json' } })} | ${{ a: true, b: false, c: 'aaa', d: 1 }}
      ${new Response(null)}                                                                                               | ${null}
      ${new Response()}                                                                                                   | ${null}
      ${new Response('')}                                                                                                 | ${null}
      ${new Response('<h1>Some text</h1>')}                                                                               | ${'<h1>Some text</h1>'}
   `('%#', async ({ response, output }) => {
      const request = new Request('https://a.b.c/')
      const responseError: ResponseError = await fallbackOptions.parseRejected(
         response,
         request,
      )
      expect(responseError instanceof ResponseError).toBeTruthy()
      expect(responseError.data).toStrictEqual(output)
      expect(responseError.response).toStrictEqual(response)
      expect(responseError.request).toBe(request)
      expect(responseError.name).toStrictEqual('ResponseError')
   })
})
