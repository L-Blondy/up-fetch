import type {
   ResolvedOptions,
   FetcherOptions,
   DefaultOptions,
   BaseFetchFn,
   Interceptors,
} from './types'
import { type FallbackOptions, fallbackOptions } from './fallback-options'
import {
   resolveParams,
   isJsonifiableObjectOrArray,
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
   TParsedData = any,
   TSchema extends StandardSchemaV1 = any,
>(
   input: Parameters<TFetchFn>[0], // fetch 1st arg
   defaultOptions: DefaultOptions<TFetchFn> = emptyOptions,
   fetcherOpts: FetcherOptions<TFetchFn, TSchema, TParsedData> = emptyOptions,
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
   let isJsonifiable: boolean
   // assign isJsonifiable value while making use of the type guard
   let body = (isJsonifiable = isJsonifiableObjectOrArray(rawBody))
      ? mergedOptions.serializeBody(rawBody)
      : rawBody

   return stripUndefined({
      // I have to cast as mergedOptions because the type breaks with omit
      ...(omit(mergedOptions, interceptors) as typeof mergedOptions),
      params,
      rawBody,
      body,
      signal: mergeSignal(mergedOptions.signal, mergedOptions.timeout),
      headers: mergeHeaders(
         isJsonifiable && typeof body === 'string'
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
