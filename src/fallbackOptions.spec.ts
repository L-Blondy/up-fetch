import { expect, test } from 'vitest'
import { fallbackOptions } from './fallbackOptions'
import { ResponseError } from './ResponseError'

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

   set c(v: number) {
      this.a = v
   }

   static d() {
      return 4
   }
}

test.each`
   input                                                                | output
   ${{ key1: true, key2: false }}                                       | ${'?key1=true&key2=false'}
   ${{ key1: 'value1', key2: 2, key3: undefined, key4: null }}          | ${'?key1=value1&key2=2&key4=null'}
   ${{ key5: '', key6: 0, key7: new Date('2023-02-15T13:46:35.046Z') }} | ${'?key5=&key6=0&key7=2023-02-15T13%3A46%3A35.046Z'}
   ${{ key5: { key: 'value' } }}                                        | ${'?key5=%5Bobject+Object%5D'}
   ${{ key5: ['string', 2, new Date('2023-02-15T13:46:35.046Z')] }}     | ${'?key5=string%2C2%2C2023-02-15T13%3A46%3A35.046Z'}
   ${{ key5: [true, false, null, undefined, 7] }}                       | ${'?key5=true%2Cfalse%2C%2C%2C7'}
   ${{ key5: [1, [2, true, null]] }}                                    | ${'?key5=1%2C2%2Ctrue%2C'}
   ${new SomeClass()}                                                   | ${'?a=1'}
`('fallbackOptions.serializeParams: $input', ({ input, output }) => {
   expect(fallbackOptions.serializeParams(input)).toBe(output)
})

test('parseError JSON', async () => {
   const fakeFetch = () => {
      return Promise.resolve(new Response('{"a":1}', { status: 400 }))
   }

   const error = await fakeFetch().then(fallbackOptions.parseError)

   expect(error instanceof ResponseError).toEqual(true)
   expect(error.data).toEqual({ a: 1 })
   expect(error.status).toEqual(400)
})

test('parseError TEXT', async () => {
   const fakeFetch = () => {
      return Promise.resolve(new Response('this is some text', { status: 400 }))
   }

   const error = await fakeFetch().then(fallbackOptions.parseError)

   expect(error instanceof ResponseError).toEqual(true)
   expect(error.data).toEqual('this is some text')
   expect(error.status).toEqual(400)
})

test('parseSuccess JSON should work by default', async () => {
   const fakeFetch = () => {
      return Promise.resolve(new Response('{"a":1}', { status: 200 }))
   }

   const data = await fakeFetch().then(fallbackOptions.parseSuccess)

   expect(data).toEqual({ a: 1 })
})

test('parseSuccess TEXT should work by default', async () => {
   const fakeFetch = () => {
      return Promise.resolve(new Response('this is some text', { status: 200 }))
   }

   const data = await fakeFetch().then(fallbackOptions.parseSuccess)

   expect(data).toEqual('this is some text')
})
