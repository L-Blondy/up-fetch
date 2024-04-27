import {
   BaseOptions,
   ComputedOptions,
   JsonifiableArray,
   JsonifiableObject,
   FetcherOptions,
   DefaultOptions,
   BaseFetchFn,
} from './types'
import { fallbackOptions } from './fallback-options'
import {
   buildParams,
   isJsonifiableObjectOrArray,
   mergeHeaders,
   strip,
   emptyOptions,
} from './utils'

export let eventListeners = [
   'onSuccess',
   'onBeforeFetch',
   'onParsingError',
   'onResponseError',
   'onRequestError',
] as const satisfies (keyof DefaultOptions & keyof FetcherOptions)[]

export let buildOptions = <TFetchFn extends BaseFetchFn, TData, TResponseError>(
   input: Parameters<TFetchFn>[0], // fetch 1st arg
   defaultOptions: DefaultOptions<TFetchFn> = emptyOptions,
   fetcherOpts: FetcherOptions<TData, TResponseError, TFetchFn> = emptyOptions,
): ComputedOptions<TData, TResponseError, TFetchFn> => {
   let mergedOptions = {
      // Necessary for some reason, probably because`BaseOptions<TFetchFn>` is not preserved properly when using `strip`
      ...({} satisfies BaseOptions<BaseFetchFn> as BaseOptions<TFetchFn>),
      ...fallbackOptions,
      ...strip(defaultOptions, eventListeners),
      ...strip(fetcherOpts, eventListeners),
   }
   let rawBody = fetcherOpts.body
   let params = buildParams(defaultOptions.params, input, fetcherOpts.params)
   let queryString = mergedOptions.serializeParams(params)
   let isJsonifiable: boolean
   // assign isJsonifiable value while making use of the type guard
   let body = (isJsonifiable = isJsonifiableObjectOrArray(rawBody))
      ? mergedOptions.serializeBody(
           rawBody as JsonifiableObject | JsonifiableArray,
        )
      : rawBody
   let headers = mergeHeaders(
      isJsonifiable && typeof body === 'string'
         ? { 'content-type': 'application/json' }
         : {},
      defaultOptions.headers,
      fetcherOpts.headers,
   )
   return {
      ...mergedOptions,
      headers,
      params,
      rawBody,
      body,
      // convenience getter, usefull if the user wants to modify the url in onBeforeFetch
      get input() {
         if (typeof input !== 'string') return input
         // assume the url contains no hash, password or username
         let url = /^https?:\/\//.test(input)
            ? input
            : [mergedOptions.baseUrl, input]
                 .map((str) => (str?.startsWith('/') ? str.slice(1) : str))
                 .filter(Boolean)
                 .join('/')
         return [url, queryString]
            .filter(Boolean)
            .join(input.includes('?') ? '&' : '?')
      },
   }
}
