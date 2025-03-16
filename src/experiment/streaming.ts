import type { BaseFetchFn } from 'src/types'

export function withResponseStreaming<TFetchFn extends BaseFetchFn>(
   fetchFn: TFetchFn,
) {
   return async (
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
   ) => {
      const response = await fetchFn(input, options, ctx)
      const body: Response['body'] =
         response.body || (response as any)._bodyInit
      const totalBytes = +(response.headers.get('content-length') || 0)
      let transferredBytes = 0

      options.onDownloadProgress?.(
         { ratio: body ? 0 : 1, totalBytes, transferredBytes },
         new Uint8Array(),
      )
      if (!body || !options.onDownloadProgress) return response

      return new Response(
         new ReadableStream({
            async start(controller) {
               for await (const chunk of body) {
                  transferredBytes += chunk.byteLength
                  options.onDownloadProgress(
                     {
                        ratio: totalBytes ? transferredBytes / totalBytes : 0,
                        transferredBytes,
                        totalBytes,
                     },
                     chunk,
                  )
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
}
