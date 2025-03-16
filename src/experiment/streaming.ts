import type { BaseFetchFn } from 'src/types'

export const withResponseStreaming =
   <TFetchFn extends BaseFetchFn>(fetchFn: TFetchFn) =>
   async (
      input: Parameters<TFetchFn>[0],
      options: Parameters<TFetchFn>[1] & {
         onResponseStreaming?: (streaming: {
            progress: number
            totalBytes: number
            transferredBytes: number
            chunk: Uint8Array
         }) => void
      } = {},
      ctx?: Parameters<TFetchFn>[2],
   ) => {
      const response = await fetchFn(input, options, ctx)
      const body: Response['body'] =
         response.body || (response as any)._bodyInit
      const totalBytes = +(response.headers.get('content-length') || 0)
      let transferredBytes = 0

      options.onResponseStreaming?.({
         progress: body ? 0 : 1,
         totalBytes,
         transferredBytes,
         chunk: new Uint8Array(),
      })
      if (!body || !options.onResponseStreaming) return response

      return new Response(
         new ReadableStream({
            async start(controller) {
               for await (const chunk of body) {
                  transferredBytes += chunk.byteLength
                  options.onResponseStreaming({
                     progress: totalBytes ? transferredBytes / totalBytes : 0,
                     transferredBytes,
                     totalBytes,
                     chunk,
                  })
                  controller.enqueue(chunk)
               }
               controller.close()
            },
         }),
         {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
         },
      )
   }

export const withRequestStreaming =
   <TFetchFn extends BaseFetchFn>(fetchFn: TFetchFn) =>
   async (
      input: string | Request | URL,
      options: Parameters<TFetchFn>[1] & {
         onRequestStreaming?: (streaming: {
            progress: number
            totalBytes: number
            transferredBytes: number
            chunk: Uint8Array
         }) => void
      } = {},
      ctx?: Parameters<TFetchFn>[2],
   ) => {
      const getBodySize = (_request: Request) => 0 // TODO
      const totalBytes = getBodySize({} as any)
      let transferredBytes = 0

      const request = new Request(input, {
         ...options,
         duplex: 'half',
         body: new ReadableStream({
            async start(controller) {
               const reader =
                  request.body instanceof ReadableStream
                     ? request.body.getReader()
                     : // biome-ignore lint/style/noNonNullAssertion: <explanation>
                       new Response('').body!.getReader()
               async function read() {
                  const { done, value } = await reader.read()
                  if (done) {
                     // Ensure 100% progress is reported when the upload is complete
                     if (options.onRequestStreaming) {
                        options.onRequestStreaming({
                           progress: 1,
                           transferredBytes,
                           totalBytes: Math.max(totalBytes, transferredBytes),
                           chunk: new Uint8Array(),
                        })
                     }
                     controller.close()
                     return
                  }
                  transferredBytes += value.byteLength
                  let progress =
                     totalBytes === 0 ? 0 : transferredBytes / totalBytes
                  if (totalBytes < transferredBytes || progress === 1) {
                     progress = 0.99
                  }
                  if (options.onRequestStreaming) {
                     options.onRequestStreaming({
                        progress: Number(progress.toFixed(2)),
                        transferredBytes,
                        totalBytes,
                        chunk: value,
                     })
                  }
                  controller.enqueue(value)
                  await read()
               }
               await read()
            },
         }),
      })
      return fetchFn(request, options, ctx)
   }
