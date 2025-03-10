import type { BaseFetchFn, MaybePromise, Prettify } from 'src/types'

export type RetryOptions = {
   when?: (response: Response, request: Request) => MaybePromise<boolean>
   times?:
      | number
      | ((response: Response, request: Request) => MaybePromise<number>)
   delay?:
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
         retry: { when = defaultRetryWhen, times = 0, delay = 0 } = {},
         ...options
      }: Prettify<
         Parameters<TFetchFn>[1] & { retry?: RetryOptions }
      > = {} as any,
      ctx?: Parameters<TFetchFn>[2],
   ): Promise<Response> {
      const request = new Request(input, options as RequestInit)
      let attempt = 1
      let maxAttempt = 1
      let response: Response

      do {
         response = await fetchFn(input, options, ctx)

         if (await when(response, request)) {
            if (maxAttempt === 1) {
               maxAttempt +=
                  typeof times === 'function'
                     ? await times(response, request)
                     : times
            }
            if (attempt < maxAttempt) {
               await timeout(
                  typeof delay === 'function'
                     ? await delay(attempt, response, request)
                     : delay,
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
