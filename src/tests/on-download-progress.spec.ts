import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { up } from 'src/up'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'

const baseUrl = 'http://a.b.c'
const encoder = new TextEncoder()

function createLargeBlob(sizeInMB: number): Blob {
   const chunkSize = 1024 * 1024 // 1MB
   // eslint-disable-next-line unicorn/no-new-array
   const chunks = new Array(sizeInMB).fill('x'.repeat(chunkSize))
   return new Blob(chunks, { type: 'application/octet-stream' })
}

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
   http.get(`${baseUrl}/chatbot-nocontentlength`, () => {
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
   http.get(`${baseUrl}/largefile`, () => {
      return new HttpResponse(createLargeBlob(10))
   }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('should call onDownloadProgress with ratio 1 when body is empty', async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   const data = await upfetch(`${baseUrl}/empty`, {
      onDownloadProgress(progress) {
         spy(progress)
      },
   })
   expect(data).toBe(null)
   expect(spy).toHaveBeenCalledWith({
      ratio: 1,
      totalBytes: 0,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
})

test('should call onDownloadProgress for each chunk', async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   const data = await upfetch(`${baseUrl}/chatbot`, {
      onDownloadProgress(progress) {
         spy(progress)
      },
   })
   expect(data).toEqual('BrandNewWorld')
   expect(spy).toHaveBeenNthCalledWith(1, {
      ratio: 0,
      totalBytes: 13,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
   expect(spy).toHaveBeenNthCalledWith(2, {
      ratio: 5 / 13,
      totalBytes: 13,
      transferredBytes: 5,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(3, {
      ratio: 8 / 13,
      totalBytes: 13,
      transferredBytes: 8,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(4, {
      ratio: 1,
      totalBytes: 13,
      transferredBytes: 13,
      chunk: expect.any(Uint8Array),
   })
})

test('should work with normal endpoints', async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   const data = await upfetch(`${baseUrl}/nostream`, {
      onDownloadProgress(progress) {
         spy(progress)
      },
   })
   expect(data).toEqual('hello')
   expect(spy).toHaveBeenCalledWith({
      ratio: 1,
      totalBytes: 5,
      transferredBytes: 5,
      chunk: expect.any(Uint8Array),
   })
})

test('should preserve headers, status, and statusText', async () => {
   const upfetch = up(fetch)
   const response = await upfetch(`${baseUrl}/nostream`, {
      parseResponse: (res) => res,
      onDownloadProgress() {},
   })
   expect(response.status).toEqual(200)
   expect(response.statusText).toEqual('status text')
   expect(response.headers.get('some')).toEqual('header')
})
