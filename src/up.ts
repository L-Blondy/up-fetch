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

      const resolvedOpts = {
         ...fallbackOptions,
         ...defaultOpts,
         ...fetcherOpts,
      }

      if('body' in fetcherOpts) {  
         resolvedOpts.body = fetcherOpts.body === null || fetcherOpts.body === undefined
            ? (fetcherOpts.body as null | undefined)
            : resolvedOpts.serializeBody(fetcherOpts.body)
      }

      resolvedOpts.headers = mergeHeaders([
         isJsonifiable(fetcherOpts.body) && typeof resolvedOpts.body === 'string'
            ? { 'content-type': 'application/json' }
            : {},
         defaultOpts.headers,
         fetcherOpts.headers,
      ])

      resolvedOpts.signal = withTimeout(
         resolvedOpts.signal ?? input.signal, 
         resolvedOpts.timeout
      )
      
      const resolvedInput = resolveInput(
         resolvedOpts.baseUrl,
         input,
         defaultOpts.params,
         fetcherOpts.params,
         resolvedOpts.serializeParams,
      )

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
            if (!(await resolvedOpts.reject(response))) {
               let parsed: Awaited<TParsedData>
               try {
                  parsed = await resolvedOpts.parseResponse(response, request)
               } catch (error: any) {
                  defaultOpts.onError?.(error, request)
                  throw error
               }
               let data: Awaited<StandardSchemaV1.InferOutput<TSchema>>
               try {
                  data = resolvedOpts.schema
                     ? await validate(resolvedOpts.schema, parsed)
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
               respError = await resolvedOpts.parseRejected(response, request)
            } catch (error: any) {
               defaultOpts.onError?.(error, request)
               throw error
            }
            defaultOpts.onError?.(respError, request)
            throw respError
         })
   }
}
