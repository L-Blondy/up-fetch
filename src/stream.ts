import type { Progress } from './types'

export async function toStreamable<R extends Request | Response>(
   reqOrRes: R,
   onStream?: (progress: Progress, reqOrRes: R) => void,
): Promise<R> {
   const isResponse = 'ok' in reqOrRes
   const body: (Request | Request)['body'] =
      reqOrRes.body || (reqOrRes as any)._bodyInit
   if (!onStream || !body) return reqOrRes
   const contentLength = reqOrRes.headers.get('content-length')
   let totalBytes: number = +(contentLength || 0)
   // For the Request, when no "Content-Length" header is present, we read the total bytes from the body
   if (!isResponse && !contentLength) {
      for await (const chunk of reqOrRes.clone().body!) {
         totalBytes += chunk.byteLength
      }
   }

   let transferredBytes = 0
   onStream(
      {
         totalBytes,
         transferredBytes,
         chunk: new Uint8Array(),
      },
      reqOrRes,
   )

   const stream = new ReadableStream({
      async start(controller) {
         for await (const chunk of reqOrRes.body!) {
            transferredBytes += chunk.byteLength
            onStream(
               {
                  totalBytes: Math.max(totalBytes, transferredBytes),
                  transferredBytes,
                  chunk,
               },
               reqOrRes,
            )
            controller.enqueue(chunk)
         }
         controller.close()
      },
   })

   return isResponse
      ? (new Response(stream, reqOrRes) as R)
      : // @ts-expect-error outdated ts types
        (new Request(reqOrRes, { body: stream, duplex: 'half' }) as R)
}
