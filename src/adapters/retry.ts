import type { BaseFetchFn, MaybePromise } from 'src/types'

export type RetryOptions = {
   attempts?: number | ((context: { request: Request }) => MaybePromise<number>)
   when?: (context: {
      response: Response
      request: Request
   }) => MaybePromise<boolean>
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
         retry: {
            when = defaultWhen,
            attempts = defaultAttempts,
            delay = 0,
         } = {},
         ...options
      }: Parameters<TFetchFn>[1] & {
         retry?: RetryOptions
         onRetry?: OnRetry
      } = {},
      ctx?: Parameters<TFetchFn>[2],
   ): Promise<Response> {
      const request = new Request(input, options as RequestInit)
      const maxAttempt =
         typeof attempts === 'function' ? await attempts({ request }) : attempts
      let attempt = 0
      let response: Response

      do {
         response = await fetchFn(input, options, ctx)

         if (++attempt <= maxAttempt && (await when({ response, request }))) {
            await timeout(
               typeof delay === 'function'
                  ? await delay({ attempt, response, request })
                  : delay,
               options.signal,
            )
            onRetry?.({ attempt, response, request })
         }
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
         // biome-ignore lint/style/noNonNullAssertion:
         reject(signal!.reason)
      }
   })

const defaultWhen = (ctx: { response: Response; request: Request }) =>
   !ctx.response.ok

const defaultAttempts = (ctx: { request: Request }) =>
   ctx.request.method === 'GET' ? 1 : 0
