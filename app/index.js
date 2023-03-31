/* eslint-disable */
import { createFetcher } from '../dist/index.js'
import fetch, { Headers } from 'node-fetch'

if (!globalThis.fetch) {
   globalThis.fetch = fetch
   globalThis.Headers = Headers
}

async function main() {
   const upfetch = createFetcher(undefined)
   try {
      const data = await upfetch({ url: 'https://dummyjson.com/products/1' })
      console.log(data)
   } catch (e) {
      console.log(e)
   }
}

main()
