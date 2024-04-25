import {
   BaseOptions,
   ComputedOptions,
   JsonifiableArray,
   JsonifiableObject,
   FetcherOptions,
   DefaultOptions,
} from './types'
import { fallbackOptions } from './fallback-options'
import {
   buildParams,
   isRequest,
   isJsonifiableObjectOrArray,
   mergeHeaders,
   strip,
   withPrefix,
   emptyOptions,
} from './utils'

export let eventListeners = [
   'onSuccess',
   'onBeforeFetch',
   'onParsingError',
   'onResponseError',
   'onRequestError',
] as const satisfies (keyof DefaultOptions & keyof FetcherOptions)[]

export let buildOptions = <
   TFetchFn extends typeof fetch,
   TData,
   TResponseError,
>(
   input: RequestInfo | URL, // fetch 1st arg
   defaultOptions: DefaultOptions<TFetchFn> = emptyOptions,
   fetcherOpts: FetcherOptions<TData, TResponseError, TFetchFn> = emptyOptions,
): ComputedOptions<TData, TResponseError, TFetchFn> => {
   let mergedOptions = {
      // Necessary for some reason, probably because`BaseOptions<TFetchFn>` is not preserved properly when using `strip`
      ...({} satisfies BaseOptions<typeof fetch> as BaseOptions<TFetchFn>),
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
         // nothing to do if we deal with a Request object
         if (isRequest(input)) return input
         // input is the source of truth
         let url: URL
         if (input instanceof URL)
            // input is the source of truth, ignore the baseUrl
            url = input
         else if (/^(http(s)?):\/\//.test(input)) {
            url = new URL(input)
         } else {
            let base = mergedOptions.baseUrl
               ? new URL(mergedOptions.baseUrl)
               : undefined
            // input is always a relative path, never a protocol
            // we can concat the base path and the input
            let path = [base?.pathname, input]
               // standardize by remiving the leading slash
               .map((str) => (str?.startsWith('/') ? str.slice(1) : str))
               // remove empty strings ('/' originaly)
               .filter(Boolean)
               .join('/')
            url = new URL(path, base?.origin)
         }
         // add the queryString to the url.search
         // (url.search is the queryString defined in the input)
         url.search += withPrefix(url.search ? '&' : '?', queryString)
         return url.href
      },
   }
}
