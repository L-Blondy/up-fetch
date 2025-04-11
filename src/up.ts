import { fallbackOptions } from './fallback-options'
import { toStreamable } from './stream'
import type {
   BaseFetchFn,
   DefaultOptions,
   DefaultRawBody,
   DistributiveOmit,
   FetcherOptions,
   MaybePromise,
   RetryContext,
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
      TFetchFn extends BaseFetchFn,
      TDefaultParsedData = any,
      TDefaultRawBody = DefaultRawBody,
   >(
      fetchFn: TFetchFn,
      getDefaultOptions: (
         input: Exclude<Parameters<TFetchFn>[0], Request>,
         fetcherOpts: FetcherOptions<TFetchFn, any, any, any>,
         ctx?: Parameters<TFetchFn>[2],
      ) => MaybePromise<
         DefaultOptions<TFetchFn, TDefaultParsedData, TDefaultRawBody>
      > = () => emptyOptions,
   ): UpFetch<TDefaultParsedData, TDefaultRawBody, TFetchFn> =>
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

      // merge event handlers
      Object.keys(defaultOpts).forEach((key) => {
         if (/^on[A-Z]/.test(key)) {
            ;(options as any)[key] = (...args: unknown[]) => {
               defaultOpts[key]?.(...args)
               fetcherOpts[key]?.(...args)
            }
         }
      })

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

      const outcome = {} as DistributiveOmit<RetryContext, 'request'>

      do {
         // per-try timeout
         options.signal = withTimeout(fetcherOpts.signal, options.timeout)

         request = await toStreamable(
            new Request(
               input.url
                  ? input // Request
                  : resolveUrl(
                       options.baseUrl,
                       input, // string | URL
                       defaultOpts.params,
                       fetcherOpts.params,
                       options.serializeParams,
                    ),
               options,
            ),
            options.onRequestStreaming,
         )
         options.onRequest?.(request)

         try {
            outcome.response = await toStreamable(
               await fetchFn(
                  request,
                  // do not override the request body & patch headers again
                  { ...omit(options, ['body']), headers: request.headers },
                  ctx,
               ),
               options.onResponseStreaming,
            )
         } catch (e: any) {
            outcome.error = e
         }

         if (
            !(await options.retry.when({ request, ...outcome })) ||
            ++attempt >
               (typeof options.retry.attempts === 'function'
                  ? await options.retry.attempts({ request })
                  : options.retry.attempts)
         )
            break

         await abortableDelay(
            typeof options.retry.delay === 'function'
               ? await options.retry.delay({ attempt, request, ...outcome })
               : options.retry.delay,
            options.signal,
         )
         options.onRetry?.({ attempt, request, ...outcome })
         // biome-ignore lint/correctness/noConstantCondition: <explanation>
      } while (true)

      if (outcome.error) {
         defaultOpts.onError?.(outcome.error, request)
         throw outcome.error
      }
      const response = outcome.response as Response

      if (!(await options.reject(response))) {
         let parsed: any
         try {
            parsed = await options.parseResponse(response, request)
         } catch (error: any) {
            options.onError?.(error, request)
            throw error
         }
         let data: any
         try {
            data = options.schema
               ? await validate(options.schema, parsed)
               : parsed
         } catch (error: any) {
            options.onError?.(error, request)
            throw error
         }
         options.onSuccess?.(data, request)
         return data
      }
      let respError: any
      try {
         respError = await options.parseRejected(response, request)
      } catch (error: any) {
         options.onError?.(error, request)
         throw error
      }
      options.onError?.(respError, request)
      throw respError
   }
