import type { BaseFetchFn } from 'src/types'

export function withResponseStreaming<TFetchFn extends BaseFetchFn>(
   fetchFn: TFetchFn,
) {
   return async function fetchWithResponseStreaming(
      input: Parameters<TFetchFn>[0],
      options: Parameters<TFetchFn>[1] & {
         onDownloadProgress?: (
            progress: {
               ratio: number
               totalBytes: number
               transferredBytes: number
            },
            chunk: Uint8Array,
         ) => void
      } = {},
      ctx?: Parameters<TFetchFn>[2],
   ) {
      const response = await fetchFn(input, options, ctx)
      const body: Response['body'] =
         response.body || (response as any)._bodyInit
      const totalBytes = +(response.headers.get('content-length') || 0)
      let transferredBytes = 0

      if (!body) {
         options.onDownloadProgress(
            { ratio: 1, totalBytes, transferredBytes },
            new Uint8Array(),
         )
         return response
      }

      return new Response(
         new ReadableStream({
            async start(controller) {
               const reader = body.getReader()

               options.onDownloadProgress?.(
                  { ratio: 0, transferredBytes: 0, totalBytes },
                  new Uint8Array(),
               )

               async function read() {
                  const { done, value } = await reader.read()
                  if (done) {
                     controller.close()
                     return
                  }

                  transferredBytes += value.byteLength
                  options.onDownloadProgress?.(
                     {
                        ratio: totalBytes ? transferredBytes / totalBytes : 0,
                        transferredBytes,
                        totalBytes,
                     },
                     value,
                  )

                  controller.enqueue(value)
                  await read()
               }

               await read()
            },
         }),
         {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
         },
      )
   }
}
