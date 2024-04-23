import {
   BaseOptions,
   ComputedOptions,
   JsonifiableArray,
   JsonifiableObject,
   UpFetchOptions,
   UpOptions,
} from './types'
import { defaultOptions } from './default-options'
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
] as const satisfies (keyof UpOptions & keyof UpFetchOptions)[]

export let buildOptions = <
   TFetchFn extends typeof fetch,
   TData,
   TResponseError,
>(
   input: RequestInfo | URL, // fetch 1st arg
   upOpts: UpOptions<TFetchFn> = emptyOptions,
   fetcherOpts: UpFetchOptions<TData, TResponseError, TFetchFn> = emptyOptions,
): ComputedOptions<TData, TResponseError, TFetchFn> => {
   let mergedOptions = {
      // Necessary for some reason, probably because`BaseOptions<TFetchFn>` is not preserved properly when using `strip`
      ...({} satisfies BaseOptions<typeof fetch> as BaseOptions<TFetchFn>),
      ...defaultOptions,
      ...strip(upOpts, eventListeners),
      ...strip(fetcherOpts, eventListeners),
   }
   let rawBody = fetcherOpts.body
   let params = buildParams(upOpts.params, input, fetcherOpts.params)
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
      upOpts.headers,
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
         if (isRequest(input)) return input
         if (input instanceof URL) return input.toString()
         let base = mergedOptions.baseUrl
            ? new URL(mergedOptions.baseUrl)
            : undefined
         let path = [base?.pathname, input.toString()]
            .map((str) => (str?.startsWith('/') ? str.slice(1) : str))
            .filter(Boolean)
            .join('/')
         let url = new URL(path, base?.origin)
         let serializedParams = mergedOptions.serializeParams(params)
         return `${url.href}${withPrefix(
            url.search ? '&' : '?',
            serializedParams,
         )}`
      },
   }
}
