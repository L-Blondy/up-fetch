import type { StreamingEvent } from './types'

/**
 * Safari does not support for await...of iteration on response/request bodies,
 * so we use the ReadableStream reader API directly
 */

const isWebkit =
   typeof window !== 'undefined' &&
   /AppleWebKit/i.test(navigator.userAgent) &&
   !/Chrome/i.test(navigator.userAgent)

export async function toStreamable<R extends Request | Response>(
   reqOrRes: R,
   onStream?: (event: StreamingEvent, reqOrRes: R) => void,
): Promise<R> {
   const isResponse = 'ok' in reqOrRes
   const isNotSupported = isWebkit && !isResponse
   // clone reqOrRes here to support IOS & Safari 14, otherwise support 15+
   if (isNotSupported || !onStream || !getBody(reqOrRes, true)) return reqOrRes
   const contentLength = reqOrRes.headers.get('content-length')
   let totalBytes: number = +(contentLength || 0)
   // For the Request, when no "Content-Length" header is present, we read the total bytes from the body
   if (!isResponse && !contentLength) {
      const reader = getBody(reqOrRes, true)!.getReader()
      while (true) {
         const { value, done } = await reader.read()
         if (done) break
         totalBytes += value.byteLength
      }
   }

   let transferredBytes = 0
   await onStream(
      { totalBytes, transferredBytes, chunk: new Uint8Array() },
      reqOrRes,
   )

   const stream = new ReadableStream({
      async start(controller) {
         const reader = getBody(reqOrRes)!.getReader()
         while (true) {
            const { value, done } = await reader.read()
            if (done) break
            transferredBytes += value.byteLength
            totalBytes = Math.max(totalBytes, transferredBytes)
            await onStream(
               { totalBytes, transferredBytes, chunk: value },
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

const getBody = (
   reqOrRes: Request | Response,
   clone?: boolean,
): (Request | Response)['body'] => {
   const r: any = clone ? reqOrRes.clone() : reqOrRes
   // r._bodyInit for React Native
   return r.body || r._bodyInit
}
