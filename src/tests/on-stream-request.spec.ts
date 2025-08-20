import fs from 'node:fs'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { up } from 'src/up'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'

const majorNodeVersion = Number(process.version.replace('v', '').split('.')[0])

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
      onRequestStreaming() {},
   })
   expect(data).toBe('hello')
})

test('should call not onRequestStreaming when body is empty', async () => {
   const upfetch = up(fetch, () => ({ baseUrl }))
   const spy = vi.fn()
   await upfetch('/text', {
      onRequestStreaming(event) {
         spy(event)
      },
   })
   expect(spy).not.toHaveBeenCalledWith()
})

test('should chunk the request body when onRequestStreaming is present', async () => {
   const sizeInMb = 10
   const upfetch = up(fetch, () => ({ baseUrl }))
   let exec = 0
   const spy = vi.fn()
   await upfetch('/large-blob', {
      method: 'POST',
      body: createLargeBlob(sizeInMb),
      onRequestStreaming(event) {
         exec++
         spy(event)
      },
   })
   expect(exec).toBeGreaterThanOrEqual(5)
   expect(spy).toHaveBeenLastCalledWith({
      totalBytes: sizeInMb * _1mb,
      transferredBytes: sizeInMb * _1mb,
      chunk: expect.any(Uint8Array),
   })
})

// File does not exist in node 18
if (majorNodeVersion > 18) {
   test('should also chunk formData', async () => {
      const upfetch = up(fetch, () => ({ baseUrl }))
      let exec = 0
      const image = fs.readFileSync(new URL('./2000@2x.png', import.meta.url))
      const formData = new FormData()
      formData.append(
         'image',
         new File([image], '2000@2x.png', { type: 'image/png' }),
      )

      await upfetch('/large-blob', {
         method: 'POST',
         body: formData,
         onRequestStreaming(event) {
            ++exec
            expect(event.totalBytes).toBeGreaterThanOrEqual(122640) // the size of the file
         },
      })
      expect(exec).toBeGreaterThanOrEqual(3)
   })
}
