import type { RequestStreamingEvent, ResponseStreamingEvent } from './types'

/**
 * Safari does not support for await...of iteration on response/request bodies,
 * so we use the ReadableStream reader API directly
 */

const isWebkit =
   typeof window !== 'undefined' &&
   /AppleWebKit/i.test(navigator.userAgent) &&
   !/Chrome/i.test(navigator.userAgent)

type StreamingEvent<R extends Request | Response> = R extends Request
   ? RequestStreamingEvent
   : R extends Response
     ? ResponseStreamingEvent
     : never

export async function toStreamable<R extends Request | Response>(
   reqOrRes: R,
   onChunk?: (event: StreamingEvent<R>, reqOrRes: R) => void,
): Promise<R> {
   const isResponse = 'ok' in reqOrRes
   const isNotSupported = isWebkit && !isResponse
   // clone reqOrRes here to support IOS & Safari 14, otherwise support 15+
   if (isNotSupported || !onChunk || !reqOrRes.clone().body) return reqOrRes
   const contentLength = reqOrRes.headers.get('content-length')
   let totalBytes = contentLength ? +contentLength : undefined
   // For the Request, when no "Content-Length" header is present, we read the total bytes from the request
   if (!isResponse && !contentLength) {
      totalBytes = (await reqOrRes.clone().arrayBuffer()).byteLength
   }

   let transferredBytes = 0
   await onChunk(
      {
         totalBytes,
         transferredBytes,
         chunk: new Uint8Array(),
      } as StreamingEvent<R>,
      reqOrRes,
   )

   const stream = new ReadableStream({
      async start(controller) {
         const reader = reqOrRes.body!.getReader()
         while (true) {
            const { value, done } = await reader.read()
            if (done) break
            transferredBytes += value.byteLength
            await onChunk(
               {
                  totalBytes,
                  transferredBytes,
                  chunk: value,
               } as StreamingEvent<R>,
               reqOrRes,
            )
            controller.enqueue(value)
         }
         controller.close()
      },
   })

   return isResponse
      ? (new Response(stream, reqOrRes) as R)
      : // @ts-expect-error outdated ts types
        (new Request(reqOrRes, { body: stream, duplex: 'half' }) as R)
}
