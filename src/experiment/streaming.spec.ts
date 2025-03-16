import { scheduler } from 'node:timers/promises'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
   afterAll,
   afterEach,
   beforeAll,
   expect,
   expectTypeOf,
   test,
   vi,
} from 'vitest'
import { withResponseStreaming } from './streaming'

const baseUrl = 'http://a.b.c'
const encoder = new TextEncoder()

const server = setupServer(
   http.get(`${baseUrl}/chatbot`, () => {
      const stream = new ReadableStream({
         start(controller) {
            // Encode the string chunks using "TextEncoder".
            controller.enqueue(encoder.encode('Brand'))
            controller.enqueue(encoder.encode('New'))
            controller.enqueue(encoder.encode('World'))
            controller.close()
         },
      })

      // Send the mocked response immediately.
      return new HttpResponse(stream, {
         headers: {
            'Content-Type': 'text/plain',
         },
      })
   }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('response streaming', async () => {
   const $fetch = withResponseStreaming(fetch)
   const result = await $fetch(`${baseUrl}/chatbot`, {
      onDownloadProgress(progress, chunk) {
         // decode the chunk
         const decoder = new TextDecoder()
         console.log(decoder.decode(chunk))
      },
   })
   expect(await result.text()).toEqual('BrandNewWorld')
})
