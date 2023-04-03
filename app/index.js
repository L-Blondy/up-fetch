/* eslint-disable */
import { createFetcher } from '../dist/index.js'
import fetch, { Headers } from 'node-fetch'

if (!globalThis.fetch) {
   globalThis.fetch = fetch
   globalThis.Headers = Headers
}

async function main() {
   const upfetch = createFetcher(() => ({
      retryTimes: 1,
      retryDelay: () => 10000,
      retryWhen: () => true,
      signal: AbortSignal.timeout(1000),
      onError(e) {
         console.log({ code: e.code, name: e.name, message: e.message })
      },
   }))
   try {
      const data = await upfetch({ url: 'https://www.google.com/fail' })
      console.log(data)
   } catch (e) {
      console.log({ code: e.code, name: e.name, message: e.message })
   }
}

main()
