import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { up } from 'src/up'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'

const baseUrl = 'http://a.b.c'
const _1mb = 1024 * 1024

// The number of chunks is equal to sizeInMB
function createLargeBlob(sizeInMB: number): Blob {
   const chunks = new Array(sizeInMB).fill('x'.repeat(_1mb))
   return new Blob(chunks, { type: 'application/octet-stream' })
}

const server = setupServer(
   http.get(`${baseUrl}/text`, () => HttpResponse.text('hello')),
   http.post(`${baseUrl}/large-blob`, () => HttpResponse.text('ok')),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('should work as usual', async () => {
   const upfetch = up(fetch, () => ({ baseUrl }))
   const data = await upfetch('/text', {
      onUploadProgress() {},
   })
   expect(data).toBe('hello')
})

test('should call onUploadProgress at least once with ratio 1 when body is empty', async () => {
   const upfetch = up(fetch, () => ({ baseUrl }))
   const spy = vi.fn()
   await upfetch('/text', {
      onUploadProgress(progress) {
         spy(progress)
      },
   })
   expect(spy).toHaveBeenCalledWith({
      ratio: 1,
      totalBytes: 0,
      transferredBytes: 0,
      chunk: new Uint8Array(),
   })
})

test('should call onUploadProgress for each chunk', async () => {
   const sizeInMb = 10
   const upfetch = up(fetch, () => ({ baseUrl }))
   const spy = vi.fn()
   await upfetch('/large-blob', {
      method: 'POST',
      body: createLargeBlob(sizeInMb),
      onUploadProgress(progress) {
         spy(progress)
      },
   })
   // once initially, then once per chunk
   expect(spy).toHaveBeenCalledTimes(sizeInMb + 1)
   expect(spy).toHaveBeenLastCalledWith({
      ratio: 1,
      totalBytes: sizeInMb * _1mb,
      transferredBytes: sizeInMb * _1mb,
      chunk: expect.any(Uint8Array),
   })
})

test('should also chunk formData', async () => {
   const sizeInMb = 10
   const upfetch = up(fetch, () => ({ baseUrl }))
   let exec = 0
   const formData = new FormData()
   formData.append('file', createLargeBlob(sizeInMb), 'large-file.bin')

   await upfetch('/large-blob', {
      method: 'POST',
      body: formData,
      onUploadProgress(progress) {
         ++exec
         expect(progress.totalBytes).toBeGreaterThanOrEqual(sizeInMb * _1mb)
      },
   })
   // once initially, then once per chunk
   expect(exec).toBeGreaterThanOrEqual(sizeInMb + 1)
})
