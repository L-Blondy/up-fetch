import type { StandardSchemaV1 } from '@standard-schema/spec'
import { resolveOptions } from './resolve-options'
import type {
   FetcherOptions,
   DefaultOptions,
   BaseFetchFn,
   FallbackOptions,
} from './types'
import { emptyOptions, parseStandardSchema } from './utils'

export function up<
   TFetchFn extends BaseFetchFn,
   TDefaultParsedData = any,
   TDefaultRawBody = Parameters<FallbackOptions<any>['serializeBody']>[0],
>(
   fetchFn: TFetchFn,
   getDefaultOptions: () => DefaultOptions<
      TFetchFn,
      TDefaultParsedData,
      TDefaultRawBody
   > = () => emptyOptions,
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
      fetcherOptions:
         | FetcherOptions<TFetchFn, TSchema, TParsedData, TRawBody>
         | ((
              defaultOptions: DefaultOptions<
                 TFetchFn,
                 TDefaultParsedData,
                 TDefaultRawBody
              >,
           ) => FetcherOptions<
              TFetchFn,
              TSchema,
              TParsedData,
              TRawBody
           >) = emptyOptions,
      ctx?: Parameters<TFetchFn>[2],
   ) => {
      let defaultOpts = getDefaultOptions()
      let fetcherOpts =
         typeof fetcherOptions === 'function'
            ? fetcherOptions(defaultOpts)
            : fetcherOptions
      let options = resolveOptions(input, defaultOpts, fetcherOpts)
      defaultOpts.onRequest?.(options)

      return fetchFn(options.input, options, ctx)
         .catch((error) => {
            defaultOpts.onError?.(error, options)
            throw error
         })
         .then(async (response: Response) => {
            if (!(await options.throwResponseError(response))) {
               let parsed: Awaited<TParsedData>
               try {
                  parsed = await options.parseResponse(response, options)
               } catch (error: any) {
                  defaultOpts.onError?.(error, options)
                  throw error
               }
               let data: Awaited<StandardSchemaV1.InferOutput<TSchema>>
               try {
                  data = options.schema
                     ? await parseStandardSchema(options.schema, parsed)
                     : parsed
               } catch (error: any) {
                  defaultOpts.onError?.(error, options)
                  throw error
               }
               defaultOpts.onSuccess?.(data, options)
               return data
            } else {
               let respError: any
               try {
                  respError = await options.parseResponseError(
                     response,
                     options,
                  )
               } catch (error: any) {
                  defaultOpts.onError?.(error, options)
                  throw error
               }
               defaultOpts.onError?.(respError, options)
               throw respError
            }
         })
   }
}
