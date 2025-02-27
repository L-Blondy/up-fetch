import type { StandardSchemaV1 } from '@standard-schema/spec'
import type {
   FetcherOptions,
   DefaultOptions,
   BaseFetchFn,
   FallbackOptions,
} from './types'
import {
   emptyOptions,
   resolveInput,
   isJsonifiable,
   mergeHeaders,
   mergeSignal,
   resolveParams,
   validate,
} from './utils'
import { fallbackOptions } from './fallback-options'

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
      let defaultOpts = getDefaultOptions(input, fetcherOpts, ctx)
      ///
      input = input?.href ?? input
      let mergedOptions = { ...fallbackOptions, ...defaultOpts, ...fetcherOpts }
      let params = resolveParams(defaultOpts.params, input, fetcherOpts.params)
      let body =
         fetcherOpts.body === null || fetcherOpts.body === undefined
            ? (fetcherOpts.body as null | undefined)
            : mergedOptions.serializeBody(fetcherOpts.body)

      let requestInput = resolveInput(
         mergedOptions.baseUrl,
         input,
         mergedOptions.serializeParams(params),
      )
      let options = {
         ...mergedOptions,
         body,
         signal: mergeSignal(mergedOptions.signal, mergedOptions.timeout),
         headers: mergeHeaders(
            isJsonifiable(fetcherOpts.body) && typeof body === 'string'
               ? { 'content-type': 'application/json' }
               : {},
            defaultOpts.headers,
            fetcherOpts.headers,
         ),
      }
      let request = new Request(requestInput, options)

      options.onRequest?.(request)

      return fetchFn(requestInput, options, ctx)
         .catch((error) => {
            options.onError?.(error, request)
            throw error
         })
         .then(async (response: Response) => {
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
            } else {
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
         })
   }
}
