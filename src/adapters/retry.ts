import type { BaseFetchFn, MaybePromise, Prettify } from 'src/types'

type RetryOptions = {
   retryWhen?: (response: Response, request: Request) => MaybePromise<boolean>
   retryTimes?:
      | number
      | ((response: Response, request: Request) => MaybePromise<number>)
   retryDelay?:
      | number
      | ((
           attempt: number,
           response: Response,
           request: Request,
        ) => MaybePromise<number>)
}

export function withRetry<TFetchFn extends BaseFetchFn>(fetchFn: TFetchFn) {
   async function fetchWithRetry(
      input: Parameters<TFetchFn>[0],
      {
         retryWhen = defaultRetryWhen,
         retryTimes = 0,
         retryDelay = 0,
         ...options
      }: Prettify<Parameters<TFetchFn>[1] & RetryOptions> = {} as any,
      ctx?: Parameters<TFetchFn>[2],
   ): Promise<Response> {
      const request = new Request(input, options as RequestInit)
      let attempt = 1
      let maxAttempt = 1
      let response: Response

      do {
         response = await fetchFn(input, options, ctx)

         if (await retryWhen(response, request)) {
            if (maxAttempt === 1) {
               maxAttempt +=
                  typeof retryTimes === 'function'
                     ? await retryTimes(response, request)
                     : retryTimes
            }
            if (attempt < maxAttempt) {
               await timeout(
                  typeof retryDelay === 'function'
                     ? await retryDelay(attempt, response, request)
                     : retryDelay,
               )
            }
         }
         attempt++
      } while (attempt <= maxAttempt)

      return response
   }
   return fetchWithRetry
}

const timeout = (delay: number) =>
   new Promise((resolve) => setTimeout(resolve, delay))

// 408 - Request Timeout
// 409 - Conflict
// 425 - Too Early (Experimental)
// 429 - Too Many Requests
// 500 - Internal Server Error
// 502 - Bad Gateway
// 503 - Service Unavailable
// 504 - Gateway Timeout
const defaultRetryWhen = (response: Response, request: Request) =>
   [408, 409, 425, 429, 500, 502, 503, 504].includes(response.status) &&
   ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'].includes(request.method)
