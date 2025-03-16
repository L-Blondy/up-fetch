import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { withResponseStreaming } from './streaming'

const baseUrl = 'http://a.b.c'
const encoder = new TextEncoder()

const server = setupServer(
   http.get(`${baseUrl}/empty`, () => {
      return new HttpResponse(null, {})
   }),
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
   http.get(`${baseUrl}/nostream`, () => {
      return HttpResponse.text('hello', {
         status: 200,
         statusText: 'status text',
         headers: { some: 'header' },
      })
   }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('should call onDownloadProgress with ratio 1 when body is empty', async () => {
   const $fetch = withResponseStreaming(fetch)
   const spy = vi.fn()
   const response = await $fetch(`${baseUrl}/empty`, {
      onResponseStreaming(streaming) {
         spy(streaming)
      },
   })
   expect(await response.body).toBeNull()
   expect(spy).toHaveBeenCalledWith({
      progress: 1,
      totalBytes: 0,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
})

test('should call onDownloadProgress for each chunk', async () => {
   const $fetch = withResponseStreaming(fetch)
   const spy = vi.fn()
   const response = await $fetch(`${baseUrl}/chatbot`, {
      onResponseStreaming(streaming) {
         spy(streaming)
      },
   })
   expect(await response.text()).toEqual('BrandNewWorld')
   expect(spy).toHaveBeenNthCalledWith(1, {
      progress: 0,
      totalBytes: 13,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
   expect(spy).toHaveBeenNthCalledWith(2, {
      progress: 5 / 13,
      totalBytes: 13,
      transferredBytes: 5,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(3, {
      progress: 8 / 13,
      totalBytes: 13,
      transferredBytes: 8,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(4, {
      progress: 1,
      totalBytes: 13,
      transferredBytes: 13,
      chunk: expect.any(Uint8Array),
   })
})

test('should work with normal endpoints', async () => {
   const $fetch = withResponseStreaming(fetch)
   const spy = vi.fn()
   const response = await $fetch(`${baseUrl}/nostream`, {
      onResponseStreaming(streaming) {
         spy(streaming)
      },
   })
   expect(await response.text()).toEqual('hello')
   expect(spy).toHaveBeenCalledWith({
      progress: 1,
      totalBytes: 5,
      transferredBytes: 5,
      chunk: expect.any(Uint8Array),
   })
})

test('should preserve headers, status, and statusText ', async () => {
   const $fetch = withResponseStreaming(fetch)
   const response = await $fetch(`${baseUrl}/nostream`, {
      onResponseStreaming() {},
   })
   expect(response.status).toEqual(200)
   expect(response.statusText).toEqual('status text')
   expect(response.headers.get('some')).toEqual('header')
})
