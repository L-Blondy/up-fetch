type Progress = {
   ratio: number
   totalBytes: number
   transferredBytes: number
   chunk: Uint8Array
}

export const streamResponse = (
   response: Response,
   onProgress?: (progress: Progress) => void,
): Response => {
   const body: Response['body'] = response.body || (response as any)._bodyInit
   const totalBytes = +(response.headers.get('content-length') || 0)
   let transferredBytes = 0

   onProgress?.({
      ratio: body ? 0 : 1,
      totalBytes,
      transferredBytes,
      chunk: new Uint8Array(),
   })
   if (!body || !onProgress) return response

   return new Response(
      new ReadableStream({
         async start(controller) {
            for await (const chunk of body) {
               transferredBytes += chunk.byteLength
               onProgress({
                  ratio: transferredBytes / totalBytes,
                  transferredBytes,
                  totalBytes,
                  chunk,
               })
               controller.enqueue(chunk)
            }
            controller.close()
         },
      }),
      response,
   )
}

export const streamRequest = async (
   request: Request,
   onProgress?: (progress: Progress) => void,
) => {
   let transferredBytes = 0
   let totalBytes = 0
   const body = request.body

   onProgress?.({
      ratio: body ? 0 : 1,
      totalBytes,
      transferredBytes,
      chunk: new Uint8Array(),
   })

   if (!body || !onProgress) return request

   for await (const chunk of request.clone().body ?? []) {
      totalBytes += chunk.byteLength
   }

   return new Request(request, {
      // @ts-expect-error Request types are out of date
      duplex: 'half',
      body: new ReadableStream({
         async start(controller) {
            for await (const chunk of body) {
               transferredBytes += chunk.byteLength
               onProgress({
                  ratio: transferredBytes / totalBytes,
                  transferredBytes,
                  totalBytes,
                  chunk,
               })
               controller.enqueue(chunk)
            }
            controller.close()
         },
      }),
   })
}
