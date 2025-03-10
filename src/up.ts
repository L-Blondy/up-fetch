import type { StandardSchemaV1 } from '@standard-schema/spec'
import { fallbackOptions } from './fallback-options'
import type {
   BaseFetchFn,
   DefaultOptions,
   FallbackOptions,
   FetcherOptions,
} from './types'
import {
   type MaybePromise,
   isJsonifiable,
   isPlainObject,
   mergeHeaders,
   resolveUrl,
   validate,
   withTimeout,
} from './utils'

const emptyOptions: any = {}

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
      }

      Object.entries(defaultOpts).forEach(([name, value]) => {
         // merge event handlers
         if (/^on[A-Z]/.test(name)) {
            ;(options as any)[name] = (...args: unknown[]) => {
               defaultOpts[name]?.(...args)
               fetcherOpts[name]?.(...args)
            }
         }
         // merge plain objects
         if (isPlainObject(value) && isPlainObject(fetcherOpts[name])) {
            ;(options as any)[name] = { ...value, ...fetcherOpts[name] }
         }
      })

      // @ts-expect-error
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

      options.signal = withTimeout(options.signal, options.timeout)

      const request = new Request(
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

      // Request has some quirks, better pass the url instead
      return fetchFn(request.url, options, ctx)
         .catch((error) => {
            defaultOpts.onError?.(error, request)
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
         })
   }
