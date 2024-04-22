import {
   BaseOptions,
   ComputedOptions,
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
): ComputedOptions<TData, TResponseError, TFetchFn> => ({
   // Necessary for some reason, probably because`BaseOptions<TFetchFn>` is not preserved properly when using `strip`
   ...({} satisfies BaseOptions<typeof fetch> as BaseOptions<TFetchFn>),
   ...defaultOptions,
   ...strip(upOpts, eventListeners),
   ...strip(fetcherOpts, eventListeners),
   headers: mergeHeaders(
      isJsonifiableObjectOrArray(fetcherOpts.body)
         ? { 'content-type': 'application/json' }
         : {},
      upOpts.headers,
      fetcherOpts.headers,
   ),
   params: buildParams(upOpts.params, input, fetcherOpts.params),
   rawBody: fetcherOpts.body,
   get body() {
      return isJsonifiableObjectOrArray(this.rawBody)
         ? this.serializeBody(this.rawBody)
         : this.rawBody
   },
   get input() {
      if (isRequest(input)) return input
      if (input instanceof URL) return input.toString()
      let base = this.baseUrl ? new URL(this.baseUrl) : undefined
      let path = [base?.pathname, input.toString()]
         .map((str) => (str?.startsWith('/') ? str.slice(1) : str))
         .filter(Boolean)
         .join('/')
      let url = new URL(path, base?.origin)
      let serializedParams = this.serializeParams(this.params)
      return `${url.href}${withPrefix(
         url.search ? '&' : '?',
         serializedParams,
      )}`
   },
})
