import {
   BaseOptions,
   ComputedOptions,
   UpFetchOptions,
   UpOptions,
} from './types.js'
import { DefaultOptions, defaultOptions } from './default-options.js'
import {
   buildParams,
   isRequest,
   isJsonifiableObjectOrArray,
   mergeHeaders,
   strip,
   withPrefix,
   emptyOptions,
} from './utils.js'

export let eventListeners = [
   'onError',
   'onSuccess',
   'beforeFetch',
   'onResponseError',
   'onUnknownError',
] as const

export let buildOptions = <
   TFetchFn extends typeof fetch,
   TData = Awaited<
      ReturnType<NonNullable<UpOptions<TFetchFn>['parseResponse']>>
   >,
   TResponseError = Awaited<
      ReturnType<NonNullable<UpOptions<TFetchFn>['parseResponseError']>>
   >,
   TUnknownError = ReturnType<
      NonNullable<UpOptions<TFetchFn>['parseUnknownError']>
   >,
>(
   input: RequestInfo | URL, // fetch 1st arg
   upOpts: UpOptions<TFetchFn> = emptyOptions,
   fetcherOpts: UpFetchOptions<
      TData,
      TResponseError,
      TUnknownError,
      TFetchFn
   > = emptyOptions,
): ComputedOptions<TData, TResponseError, TUnknownError, TFetchFn> => {
   return {
      // For some strange reason, at some point in the return object I have the BaseOptions<TFetchFn>
      ...(defaultOptions as DefaultOptions & BaseOptions<TFetchFn>),
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
         const base = this.baseUrl ? new URL(this.baseUrl) : undefined
         const path = [base?.pathname, input.toString()]
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
   }
}
