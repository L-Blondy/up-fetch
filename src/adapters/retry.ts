import type { BaseFetchFn, MaybePromise } from 'src/types'

export type RetryOptions = {
   enabled?:
      | boolean
      | ((context: {
           response: Response
           request: Request
        }) => MaybePromise<boolean>)
   times?:
      | number
      | ((context: {
           response: Response
           request: Request
        }) => MaybePromise<number>)
   delay?:
      | number
      | ((context: {
           attempt: number
           response: Response
           request: Request
        }) => MaybePromise<number>)
}

type OnRetry = (context: {
   attempt: number
   response: Response
   request: Request
}) => MaybePromise<void>

export function withRetry<TFetchFn extends BaseFetchFn>(fetchFn: TFetchFn) {
   async function fetchWithRetry(
      input: Parameters<TFetchFn>[0],
      {
         onRetry,
         retry: { enabled = true, times = defaultTimes, delay = 0 } = {},
         ...options
      }: Parameters<TFetchFn>[1] & {
         retry?: RetryOptions
         onRetry?: OnRetry
      } = {} as any,
      ctx?: Parameters<TFetchFn>[2],
   ): Promise<Response> {
      const request = new Request(input, options as RequestInit)
      let attempt = 1
      let maxAttempt = 1
      let response: Response

      do {
         response = await fetchFn(input, options, ctx)

         const isEnabled =
            enabled === true
               ? defaultEnabled
               : typeof enabled === 'function'
                 ? await enabled({ response, request })
                 : enabled

         if (isEnabled) {
            if (maxAttempt === 1) {
               maxAttempt +=
                  typeof times === 'function'
                     ? await times({ response, request })
                     : times
            }
            if (attempt < maxAttempt) {
               await timeout(
                  typeof delay === 'function'
                     ? await delay({ attempt, response, request })
                     : delay,
                  options.signal,
               )
               onRetry?.({ attempt, response, request })
            }
         }
         attempt++
      } while (attempt <= maxAttempt)

      return response
   }
   return fetchWithRetry
}

const timeout = (delay: number, signal?: AbortSignal) =>
   new Promise<void>((resolve, reject) => {
      signal?.throwIfAborted()
      signal?.addEventListener('abort', handleAbort, { once: true })

      const token = setTimeout(() => {
         signal?.removeEventListener('abort', handleAbort)
         resolve()
      }, delay)

      function handleAbort() {
         clearTimeout(token)
         // biome-ignore lint/style/noNonNullAssertion: <explanation>
         reject(signal!.reason)
      }
   })

const defaultEnabled = (ctx: { response: Response; request: Request }) =>
   !ctx.response.ok

const defaultTimes = (ctx: { response: Response; request: Request }) =>
   ctx.request.method === 'GET' ? 1 : 0
