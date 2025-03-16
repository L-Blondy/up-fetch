import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
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
            'Content-Length': 'BrandNewWorld'.length.toString(),
         },
      })
   }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('response streaming', async () => {
   const $fetch = withResponseStreaming(fetch)
   const spy = vi.fn()
   const result = await $fetch(`${baseUrl}/chatbot`, {
      onDownloadProgress(progress, chunk) {
         spy(progress, chunk)
      },
   })
   expect(await result.text()).toEqual('BrandNewWorld')
   expect(spy).toHaveBeenNthCalledWith(
      1,
      { ratio: 0, totalBytes: 13, transferredBytes: 0 },
      new Uint8Array(),
   )
   expect(spy).toHaveBeenNthCalledWith(
      2,
      { ratio: 5 / 13, totalBytes: 13, transferredBytes: 5 },
      expect.any(Uint8Array),
   )
   expect(spy).toHaveBeenNthCalledWith(
      3,
      { ratio: 8 / 13, totalBytes: 13, transferredBytes: 8 },
      expect.any(Uint8Array),
   )
   expect(spy).toHaveBeenNthCalledWith(
      4,
      { ratio: 1, totalBytes: 13, transferredBytes: 13 },
      expect.any(Uint8Array),
   )
})
