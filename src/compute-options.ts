import type {
   BaseOptions,
   ComputedOptions,
   JsonifiableArray,
   JsonifiableObject,
   FetcherOptions,
   DefaultOptions,
   BaseFetchFn,
   Interceptors,
} from './types'
import { type FallbackOptions, fallbackOptions } from './fallback-options'
import {
   computeParams,
   isJsonifiableObjectOrArray,
   mergeHeaders,
   omit,
   emptyOptions,
   getUrl,
   stripUndefined,
} from './utils'

export let interceptors: Interceptors = [
   'onBeforeFetch',
   'onParsingError',
   'onRequestError',
   'onResponseError',
   'onSuccess',
   'onTransformError',
]

export let computeOptions = <
   TFetchFn extends BaseFetchFn,
   TParsedData = any,
   TData = TParsedData,
   TError = any,
>(
   input: Parameters<TFetchFn>[0], // fetch 1st arg
   defaultOptions: DefaultOptions<TFetchFn> = emptyOptions,
   fetcherOpts: FetcherOptions<
      TFetchFn,
      TData,
      TError,
      TParsedData
   > = emptyOptions,
): ComputedOptions<TFetchFn, TData, TError, TParsedData> => {
   // transform URL to string right away
   input = input?.href ?? input
   let mergedOptions = {
      // Necessary for some reason, probably because`BaseOptions<TFetchFn>` is not preserved properly when using `strip`
      ...(emptyOptions as BaseOptions<TFetchFn>),
      ...(fallbackOptions as FallbackOptions<TFetchFn, TError>),
      ...omit(defaultOptions, interceptors),
      ...omit(fetcherOpts, interceptors),
   }
   let rawBody = fetcherOpts.body
   let params = computeParams(defaultOptions.params, input, fetcherOpts.params)
   let isJsonifiable: boolean
   // assign isJsonifiable value while making use of the type guard
   let body = (isJsonifiable = isJsonifiableObjectOrArray(rawBody))
      ? mergedOptions.serializeBody(
           rawBody as JsonifiableObject | JsonifiableArray,
        )
      : rawBody

   return stripUndefined({
      ...mergedOptions,
      headers: mergeHeaders(
         isJsonifiable && typeof body === 'string'
            ? { 'content-type': 'application/json' }
            : {},
         defaultOptions.headers,
         fetcherOpts.headers,
      ),
      params,
      rawBody,
      body,
      input: getUrl(
         mergedOptions.baseUrl,
         input,
         mergedOptions.serializeParams(params),
      ),
   })
}
