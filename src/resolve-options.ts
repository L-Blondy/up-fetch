import type {
   ResolvedOptions,
   FetcherOptions,
   DefaultOptions,
   BaseFetchFn,
   Interceptors,
   FallbackOptions,
} from './types'
import { fallbackOptions } from './fallback-options'
import {
   resolveParams,
   isJsonifiable,
   mergeHeaders,
   omit,
   emptyOptions,
   getUrl,
   stripUndefined,
   mergeSignal,
} from './utils'
import type { StandardSchemaV1 } from '@standard-schema/spec'

export let interceptors: Interceptors = ['onRequest', 'onSuccess', 'onError']

export let resolveOptions = <
   TFetchFn extends BaseFetchFn,
   TParsedData,
   TSchema extends StandardSchemaV1,
   TRawBody,
>(
   input: Parameters<TFetchFn>[0], // fetch 1st arg
   defaultOptions: DefaultOptions<TFetchFn, any, any> = emptyOptions,
   fetcherOpts: FetcherOptions<
      TFetchFn,
      TSchema,
      TParsedData,
      TRawBody
   > = emptyOptions,
): ResolvedOptions<TFetchFn, TSchema, TParsedData> => {
   // transform URL to string right away
   input = input?.href ?? input
   let mergedOptions = {
      ...(fallbackOptions as FallbackOptions<TFetchFn>),
      ...defaultOptions,
      ...fetcherOpts,
   }
   let rawBody = fetcherOpts.body
   let params = resolveParams(defaultOptions.params, input, fetcherOpts.params)

   let body: BodyInit | null | undefined =
      rawBody === null || rawBody === undefined
         ? (rawBody as null | undefined)
         : mergedOptions.serializeBody(rawBody)

   return stripUndefined({
      // I have to cast as mergedOptions because the type breaks with omit
      ...(omit(mergedOptions, interceptors) as typeof mergedOptions),
      params,
      rawBody,
      body,
      signal: mergeSignal(mergedOptions.signal, mergedOptions.timeout),
      headers: mergeHeaders(
         isJsonifiable(rawBody) && typeof body === 'string'
            ? { 'content-type': 'application/json' }
            : {},
         defaultOptions.headers,
         fetcherOpts.headers,
      ),
      input: getUrl(
         mergedOptions.baseUrl,
         input,
         mergedOptions.serializeParams(params),
      ),
   })
}
