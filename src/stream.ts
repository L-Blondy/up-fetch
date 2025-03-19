import type { Progress } from './types'

export const toStreamableResponse = (
   response: Response,
   onProgress?: (progress: Progress, response: Response) => void,
): Response => {
   if (!onProgress || !response.body) return response
   const totalBytes = +(response.headers.get('content-length') || 0)

   return new Response(
      toReadableStream(response, totalBytes, onProgress),
      response,
   )
}

export const toStreamableRequest = async (
   request: Request,
   onProgress?: (progress: Progress, request: Request) => void,
): Promise<Request> => {
   if (!onProgress || !request.body) return request
   let totalBytes = 0

   // biome-ignore lint/style/noNonNullAssertion:
   for await (const chunk of request.clone().body!) {
      totalBytes += chunk.byteLength
   }

   return new Request(request, {
      // @ts-expect-error Request types are out of date
      duplex: 'half',
      body: toReadableStream(request, totalBytes, onProgress),
   })
}

const toReadableStream = <R extends Request | Response>(
   reqOrRes: R,
   totalBytes: number,
   onProgress: (progress: Progress, reqOrRes: R) => void,
) => {
   const body: NonNullable<(Response | Request)['body']> =
      reqOrRes.body || (reqOrRes as any)._bodyInit
   let transferredBytes = 0

   onProgress(
      {
         ratio: body ? 0 : 1,
         totalBytes,
         transferredBytes,
         chunk: new Uint8Array(),
      },
      reqOrRes,
   )

   return new ReadableStream({
      async start(controller) {
         for await (const chunk of body) {
            transferredBytes += chunk.byteLength
            onProgress(
               {
                  ratio: transferredBytes / totalBytes,
                  transferredBytes,
                  totalBytes,
                  chunk,
               },
               reqOrRes,
            )
            controller.enqueue(chunk)
         }
         controller.close()
      },
   })
}
