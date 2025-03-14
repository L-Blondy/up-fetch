import type { StandardSchemaV1 } from '@standard-schema/spec'
import { fallbackOptions } from './fallback-options'
import type {
   BaseFetchFn,
   DefaultOptions,
   FallbackOptions,
   FetcherOptions,
   MaybePromise,
} from './types'
import {
   abortableDelay,
   isJsonifiable,
   mergeHeaders,
   resolveUrl,
   validate,
   withTimeout,
} from './utils'

const emptyOptions = {} as any

export const up =
   <
      TFetchFn extends BaseFetchFn,
      TDefaultParsedData = any,
      TDefaultRawBody = Parameters<FallbackOptions['serializeBody']>[0],
   >(
      fetchFn: TFetchFn,
      getDefaultOptions: (
         input: Exclude<Parameters<TFetchFn>[0], Request>,
         fetcherOpts: FetcherOptions<TFetchFn, any, any, any>,
         ctx?: Parameters<TFetchFn>[2],
      ) => MaybePromise<
         DefaultOptions<TFetchFn, TDefaultParsedData, TDefaultRawBody>
      > = () => emptyOptions,
   ) =>
   async <
      TParsedData = TDefaultParsedData,
      TSchema extends StandardSchemaV1<
         TParsedData,
         any
      > = StandardSchemaV1<TParsedData>,
      TRawBody = TDefaultRawBody,
   >(
      input: Exclude<Parameters<TFetchFn>[0], Request>,
      fetcherOpts: FetcherOptions<
         TFetchFn,
         TSchema,
         TParsedData,
         TRawBody
      > = emptyOptions,
      ctx?: Parameters<TFetchFn>[2],
   ) => {
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

      // biome-ignore lint/style/useConst:
      let outcome:
         | { response: Response; error: undefined }
         | { response: undefined; error: {} } = {} as any

      do {
         // per-try timeout
         options.signal = withTimeout(fetcherOpts.signal, options.timeout)

         request = new Request(
            resolveUrl(
               options.baseUrl,
               input,
               defaultOpts.params,
               fetcherOpts.params,
               options.serializeParams,
            ),
            options,
         )
         options.onRequest?.(request)
         try {
            // Request has some quirks, better pass the url instead
            outcome.response = await fetchFn(request.url, options, ctx)
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
         let parsed: Awaited<TParsedData>
         try {
            parsed = await options.parseResponse(response, request)
         } catch (error: any) {
            options.onError?.(error, request)
            throw error
         }
         let data: Awaited<StandardSchemaV1.InferOutput<TSchema>>
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
