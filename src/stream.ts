type Progress = {
   ratio: number
   totalBytes: number
   transferredBytes: number
   chunk: Uint8Array
}

export const toStreamableResponse = (
   response: Response,
   onProgress?: (progress: Progress) => void,
): Response => {
   if (!onProgress) return response
   const totalBytes = +(response.headers.get('content-length') || 0)

   return new Response(
      toReadableStream(response, totalBytes, onProgress),
      response,
   )
}

export const toStreamableRequest = async (
   request: Request,
   onProgress?: (progress: Progress) => void,
): Promise<Request> => {
   if (!onProgress) return request
   let totalBytes = 0

   for await (const chunk of request.clone().body ?? []) {
      totalBytes += chunk.byteLength
   }

   return new Request(request, {
      // @ts-expect-error Request types are out of date
      duplex: 'half',
      body: toReadableStream(request, totalBytes, onProgress),
   })
}

const toReadableStream = (
   reqOrRes: Request | Response,
   totalBytes: number,
   onProgress: (progress: Progress) => void,
) => {
   const body: (Response | Request)['body'] =
      reqOrRes.body || (reqOrRes as any)._bodyInit
   let transferredBytes = 0

   onProgress({
      ratio: body ? 0 : 1,
      totalBytes,
      transferredBytes,
      chunk: new Uint8Array(),
   })
   if (!body) return reqOrRes.body

   return new ReadableStream({
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
   })
}
