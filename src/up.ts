import type { StandardSchemaV1 } from '@standard-schema/spec'
import { fallbackOptions } from './fallback-options'
import type {
   BaseFetchFn,
   DefaultOptions,
   FallbackOptions,
   FetcherOptions,
} from './types'
import {
   emptyOptions,
   isJsonifiable,
   mergeHeaders,
   resolveInput,
   validate,
   withTimeout,
} from './utils'

export function up<
   TFetchFn extends BaseFetchFn,
   TDefaultParsedData = any,
   TDefaultRawBody = Parameters<FallbackOptions['serializeBody']>[0],
>(
   fetchFn: TFetchFn,
   getDefaultOptions: (
      input: Parameters<TFetchFn>[0],
      fetcherOpts: FetcherOptions<TFetchFn, any, any, any>,
      ctx?: Parameters<TFetchFn>[2],
   ) => DefaultOptions<TFetchFn, TDefaultParsedData, TDefaultRawBody> = () =>
      emptyOptions,
) {
   return <
      TParsedData = TDefaultParsedData,
      TSchema extends StandardSchemaV1<
         TParsedData,
         any
      > = StandardSchemaV1<TParsedData>,
      TRawBody = TDefaultRawBody,
   >(
      input: Parameters<TFetchFn>[0],
      fetcherOpts: FetcherOptions<
         TFetchFn,
         TSchema,
         TParsedData,
         TRawBody
      > = emptyOptions,
      ctx?: Parameters<TFetchFn>[2],
   ) => {
      const defaultOpts = getDefaultOptions(input, fetcherOpts, ctx)

      const mergedOpts = {
         ...fallbackOptions,
         ...defaultOpts,
         ...fetcherOpts,
      }

      const body =
         fetcherOpts.body === null || fetcherOpts.body === undefined
            ? (fetcherOpts.body as null | undefined)
            : mergedOpts.serializeBody(fetcherOpts.body)

      const resolvedInput = resolveInput(
         mergedOpts.baseUrl,
         input,
         defaultOpts.params,
         fetcherOpts.params,
         mergedOpts.serializeParams,
      )

      const resolvedOpts =
         /**
          * Need to decide on params/headers/signal handling strategy:
          * 1. Merge with Request (non-standard behavior)
          * 2. Keep Request as-is (different from string/URL handling)
          * 3. Ignore options entirely when input is Request (current approach)
          */
         resolvedInput instanceof Request
            ? {}
            : {
                 ...mergedOpts,
                 body,
                 signal: withTimeout(mergedOpts.signal, mergedOpts.timeout),
                 headers: mergeHeaders([
                    isJsonifiable(fetcherOpts.body) && typeof body === 'string'
                       ? { 'content-type': 'application/json' }
                       : {},
                    defaultOpts.headers,
                    fetcherOpts.headers,
                 ]),
              }

      /**
       * Request object used only for lifecycle hooks, not passed to fetchFn
       * since fetchFn may not support Request interface
       */
      const request = new Request(resolvedInput, resolvedOpts)

      defaultOpts.onRequest?.(request)

      return fetchFn(resolvedInput, resolvedOpts, ctx)
         .catch((error) => {
            defaultOpts.onError?.(error, request)
            throw error
         })
         .then(async (response: Response) => {
            if (!(await mergedOpts.reject(response))) {
               let parsed: Awaited<TParsedData>
               try {
                  parsed = await mergedOpts.parseResponse(response, request)
               } catch (error: any) {
                  defaultOpts.onError?.(error, request)
                  throw error
               }
               let data: Awaited<StandardSchemaV1.InferOutput<TSchema>>
               try {
                  data = mergedOpts.schema
                     ? await validate(mergedOpts.schema, parsed)
                     : parsed
               } catch (error: any) {
                  defaultOpts.onError?.(error, request)
                  throw error
               }
               defaultOpts.onSuccess?.(data, request)
               return data
            }
            let respError: any
            try {
               respError = await mergedOpts.parseRejected(response, request)
            } catch (error: any) {
               defaultOpts.onError?.(error, request)
               throw error
            }
            defaultOpts.onError?.(respError, request)
            throw respError
         })
   }
}
