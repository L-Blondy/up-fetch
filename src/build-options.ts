import {
   BaseOptions,
   ComputedOptions,
   JsonifiableArray,
   JsonifiableObject,
   FetcherOptions,
   DefaultOptions,
   BaseFetchFn,
} from './types'
import { FallbackOptions, fallbackOptions } from './fallback-options'
import {
   buildParams,
   isJsonifiableObjectOrArray,
   mergeHeaders,
   strip,
   emptyOptions,
   getUrl,
} from './utils'

export let eventListeners = [
   'onSuccess',
   'onBeforeFetch',
   'onParsingError',
   'onResponseError',
   'onRequestError',
] as const satisfies (keyof DefaultOptions & keyof FetcherOptions)[]

export let buildOptions = <
   TFetchFn extends BaseFetchFn,
   TParsedData,
   TData = TParsedData,
   TError = any,
>(
   input: Parameters<TFetchFn>[0], // fetch 1st arg
   defaultOptions: DefaultOptions<TFetchFn> = emptyOptions,
   fetcherOpts: FetcherOptions<
      TData,
      TError,
      TParsedData,
      TFetchFn
   > = emptyOptions,
): ComputedOptions<TData, TError, TParsedData, TFetchFn> => {
   // transform URL to string right away
   input = input?.href ?? input
   let mergedOptions = {
      // Necessary for some reason, probably because`BaseOptions<TFetchFn>` is not preserved properly when using `strip`
      ...({} satisfies BaseOptions<BaseFetchFn> as BaseOptions<TFetchFn>),
      ...fallbackOptions,
      ...strip(defaultOptions, eventListeners),
      ...strip(fetcherOpts, eventListeners),
   }
   let rawBody = fetcherOpts.body
   let params = buildParams(defaultOptions.params, input, fetcherOpts.params)
   let isJsonifiable: boolean
   // assign isJsonifiable value while making use of the type guard
   let body = (isJsonifiable = isJsonifiableObjectOrArray(rawBody))
      ? mergedOptions.serializeBody(
           rawBody as JsonifiableObject | JsonifiableArray,
        )
      : rawBody

   return {
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
   }
}
