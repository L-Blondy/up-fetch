import type { BaseFetchFn, MaybePromise, Prettify } from 'src/types'

type RetryOptions = {
   retryDelay?: (
      attempt: number,
      response: Response,
      request: Request,
   ) => MaybePromise<number>
   retryTimes?: (response: Response, request: Request) => MaybePromise<number>
   retryWhen?: (response: Response, request: Request) => MaybePromise<boolean>
}

// TODO fix
const request = new Request('https://a.b.c')

export function withRetry<TFetchFn extends BaseFetchFn>(fetchFn: TFetchFn) {
   async function fetchWithRetry(
      input: Parameters<TFetchFn>[0],
      options: Prettify<Parameters<TFetchFn>[1] & RetryOptions> = {} as any,
      ctx?: Parameters<TFetchFn>[2],
   ): Promise<Response> {
      let [attempt, maxAttempt] = [0, 1]
      let response: Response
      while (attempt < maxAttempt) {
         attempt++
         response = await fetchFn(input, options, ctx)
         const retryWhen = options.retryWhen ?? defaultRetryWhen
         const shouldRetry = await retryWhen(response, request)
         if (shouldRetry && maxAttempt === 1) {
            maxAttempt += (await options.retryTimes?.(response, request)) ?? 0
         }
         if (shouldRetry && attempt < maxAttempt) {
            const delay = await options.retryDelay?.(attempt, response, request)
            delay && (await timeout(delay))
         }
      }
      // @ts-expect-error the while loop will exec at least once
      return response
   }
   return fetchWithRetry
}

function timeout(delay: number | undefined) {
   return new Promise<void>((resolve) => setTimeout(() => resolve(), delay))
}

// 408 - Request Timeout
// 409 - Conflict
// 425 - Too Early (Experimental)
// 429 - Too Many Requests
// 500 - Internal Server Error
// 502 - Bad Gateway
// 503 - Service Unavailable
// 504 - Gateway Timeout
const retryStatusCodes = [408, 409, 425, 429, 500, 502, 503, 504]
const retryMethods = ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE']
const defaultRetryWhen = (response: Response, request: Request) =>
   retryStatusCodes.includes(response.status) &&
   retryMethods.includes(request.method)
