import { fallbackOptions } from './fallback-options'
import { toStreamable } from './stream'
import type {
   DefaultOptions,
   DefaultRawBody,
   FetcherOptions,
   MaybePromise,
   MinFetchFn,
   UpFetch,
} from './types'
import {
   abortableDelay,
   isJsonifiable,
   mergeHeaders,
   omit,
   resolveUrl,
   validate,
   withTimeout,
} from './utils'

const emptyOptions = {} as any

export const up =
   <
      const TFetchFn extends MinFetchFn,
      const TDefaultOptions extends DefaultOptions<
         TFetchFn,
         any,
         any
      > = DefaultOptions<TFetchFn, any, DefaultRawBody>,
   >(
      fetchFn: TFetchFn,
      getDefaultOptions: (
         input: Parameters<TFetchFn>[0],
         fetcherOpts: FetcherOptions<TFetchFn, any, any, any>,
         ctx?: Parameters<TFetchFn>[2],
      ) => MaybePromise<TDefaultOptions> = () => emptyOptions,
   ): UpFetch<TFetchFn, TDefaultOptions> =>
   async (input, fetcherOpts = emptyOptions, ctx) => {
      const defaultOpts = await getDefaultOptions(input, fetcherOpts, ctx)

      const options = {
         ...fallbackOptions,
         ...defaultOpts,
         ...fetcherOpts,
         ...(emptyOptions as { body: BodyInit | null | undefined }),
         retry: {
            ...fallbackOptions.retry,
            ...defaultOpts.retry,
            ...fetcherOpts.retry,
         },
      }

      options.body =
         fetcherOpts.body === null || fetcherOpts.body === undefined
            ? (fetcherOpts.body as null | undefined)
            : options.serializeBody(fetcherOpts.body)

      options.headers = mergeHeaders([
         isJsonifiable(fetcherOpts.body) && typeof options.body === 'string'
            ? { 'content-type': 'application/json' }
            : {},
         defaultOpts.headers,
         fetcherOpts.headers,
      ])

      let attempt = 0
      let request: Request
      let response: Response | undefined
      let error: unknown

      do {
         // per-try timeout
         options.signal = withTimeout(fetcherOpts.signal, options.timeout)

         request = await toStreamable(
            new Request(
               input.url
                  ? input // Request
                  : resolveUrl(
                       options.baseUrl,
                       input as unknown as string | URL,
                       defaultOpts.params,
                       fetcherOpts.params,
                       options.serializeParams,
                    ),
               options as any,
            ),
            fetcherOpts.onRequestStreaming,
         )

         try {
            //https://github.com/L-Blondy/up-fetch/issues/67
            await defaultOpts.onRequest?.(request)
            await fetcherOpts.onRequest?.(request)

            response = await toStreamable(
               await fetchFn(
                  request,
                  // do not override the request body & patch headers again
                  { ...omit(options, ['body']), headers: request.headers },
                  ctx,
               ),
               fetcherOpts.onResponseStreaming,
            )
            error = undefined
         } catch (e: any) {
            error = e
            // continue to retry
         }

         try {
            if (
               !(await options.retry.when({ request, response, error })) ||
               ++attempt >
                  (typeof options.retry.attempts === 'function'
                     ? await options.retry.attempts({ request })
                     : options.retry.attempts)
            )
               break

            const retryCtx = { attempt, request, response, error }
            await abortableDelay(
               typeof options.retry.delay === 'function'
                  ? await options.retry.delay(retryCtx)
                  : options.retry.delay,
               options.signal,
            )
            defaultOpts.onRetry?.(retryCtx)
            fetcherOpts.onRetry?.(retryCtx)
         } catch (e: any) {
            error = e
            break // no retry
         }
         // biome-ignore lint/correctness/noConstantCondition: false
      } while (true)

      try {
         if (error) throw error
         if (await options.reject(response!)) {
            throw await options.parseRejected(response!, request)
         }
         const parsed = await options.parseResponse(response!, request)
         const data = options.schema
            ? await validate(options.schema, parsed)
            : parsed
         defaultOpts.onSuccess?.(data, request)
         fetcherOpts.onSuccess?.(data, request)
         return data
      } catch (error: any) {
         defaultOpts.onError?.(error, request)
         fetcherOpts.onError?.(error, request)
         throw error
      }
   }
