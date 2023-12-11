import {
   BaseOptions,
   ComputedOptions,
   UpFetchOptions,
   UpOptions,
} from './types.js'
import { defaultOptions } from './default-options.js'
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
   TUpOptions extends UpOptions,
   TFetchData = Awaited<ReturnType<NonNullable<TUpOptions['parseResponse']>>>,
   TFetchResponseError = Awaited<
      ReturnType<NonNullable<TUpOptions['parseResponseError']>>
   >,
   TFetchUnknownError = ReturnType<
      NonNullable<TUpOptions['parseUnknownError']>
   >,
>(
   input: RequestInfo | URL, // fetch 1st arg
   upOpts: TUpOptions = emptyOptions,
   fetcherOpts: UpFetchOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError,
      TFetchFn
   > = emptyOptions,
): ComputedOptions<
   TFetchData,
   TFetchResponseError,
   TFetchUnknownError,
   TFetchFn
> => ({
   ...(defaultOptions as CastDefaultOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError,
      TFetchFn
   >),
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
         ? this.serializeBody(this.rawBody, defaultOptions.serializeBody)
         : this.rawBody
   },
   get input() {
      if (isRequest(input)) return input
      let url = new URL(input, this.baseUrl)
      let serializedParams = this.serializeParams(
         this.params,
         defaultOptions.serializeParams,
      )
      return `${url.href}${withPrefix(
         url.search ? '&' : '?',
         serializedParams,
      )}`
   },
})

type CastDefaultOptions<
   TFetchData = any,
   TFetchResponseError = any,
   TFetchUnknownError = any,
   TFetchFn extends typeof fetch = typeof fetch,
> = BaseOptions<TFetchFn> & { baseUrl?: string; method?: string } & Pick<
      ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError,
         TFetchFn
      >,
      | 'parseResponse'
      | 'parseResponseError'
      | 'parseUnknownError'
      | 'serializeBody'
      | 'serializeParams'
   >
