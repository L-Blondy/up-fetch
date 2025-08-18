import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { up } from 'src/up'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'

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
         headers: { 'Content-Type': 'text/plain' },
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

test('should not call onResponseStreaming when body is empty', async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   const data = await upfetch(`${baseUrl}/empty`, {
      onResponseStreaming(event) {
         spy(event)
      },
   })
   expect(data).toBe(null)
   expect(spy).not.toHaveBeenCalled()
})

test("should infer totalBytes from the 'Content-Length' header", async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   await upfetch(`${baseUrl}/chatbot`, {
      onResponseStreaming(event) {
         spy(event)
      },
   })
   expect(spy).toHaveBeenCalledWith({
      totalBytes: 13,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
})

test('should call onResponseStreaming for each chunk', async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   const data = await upfetch(`${baseUrl}/chatbot`, {
      onResponseStreaming(event) {
         spy(event)
      },
   })
   expect(data).toEqual('BrandNewWorld')
   expect(spy).toHaveBeenNthCalledWith(1, {
      totalBytes: 13,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
   expect(spy).toHaveBeenNthCalledWith(2, {
      totalBytes: 13,
      transferredBytes: 5,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(3, {
      totalBytes: 13,
      transferredBytes: 8,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(4, {
      totalBytes: 13,
      transferredBytes: 13,
      chunk: expect.any(Uint8Array),
   })
})

test("should have totalBytes === undefined if no 'Content-Length' header is present", async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   const data = await upfetch(`${baseUrl}/chatbot-nocontentlength`, {
      onResponseStreaming(event) {
         spy(event)
      },
   })
   expect(data).toEqual('BrandNewWorld')
   expect(spy).toHaveBeenNthCalledWith(1, {
      totalBytes: undefined,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
   expect(spy).toHaveBeenNthCalledWith(2, {
      totalBytes: undefined,
      transferredBytes: 5,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(3, {
      totalBytes: undefined,
      transferredBytes: 8,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(4, {
      totalBytes: undefined,
      transferredBytes: 13,
      chunk: expect.any(Uint8Array),
   })
})

test('Should allow setting a default value for totalBytes', async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   const data = await upfetch(`${baseUrl}/chatbot-nocontentlength`, {
      onResponseStreaming({
         chunk,
         transferredBytes,
         totalBytes = transferredBytes,
      }) {
         spy({
            chunk,
            transferredBytes,
            totalBytes,
         })
      },
   })
   expect(data).toEqual('BrandNewWorld')
   expect(spy).toHaveBeenNthCalledWith(1, {
      totalBytes: 0,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
   expect(spy).toHaveBeenNthCalledWith(2, {
      totalBytes: 5,
      transferredBytes: 5,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(3, {
      totalBytes: 8,
      transferredBytes: 8,
      chunk: expect.any(Uint8Array),
   })
   expect(spy).toHaveBeenNthCalledWith(4, {
      totalBytes: 13,
      transferredBytes: 13,
      chunk: expect.any(Uint8Array),
   })
})

test('should work with normal endpoints', async () => {
   const upfetch = up(fetch)
   const spy = vi.fn()
   const data = await upfetch(`${baseUrl}/nostream`, {
      onResponseStreaming(event) {
         spy(event)
      },
   })
   expect(data).toEqual('hello')
   expect(spy).toHaveBeenCalledWith({
      totalBytes: 5,
      transferredBytes: 5,
      chunk: expect.any(Uint8Array),
   })
})

test('should preserve headers, status, and statusText', async () => {
   const upfetch = up(fetch)
   const response = await upfetch(`${baseUrl}/nostream`, {
      parseResponse: (res) => res,
      onResponseStreaming() {},
   })
   expect(response.status).toEqual(200)
   expect(response.statusText).toEqual('status text')
   expect(response.headers.get('some')).toEqual('header')
})
