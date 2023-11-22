import { ResponseError } from './response-error.js'
import {
   UpFetchOptions,
   DefaultOptions,
   FetchOptions,
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
} from './utils.js'

export let eventListeners = [
   'onError',
   'onSuccess',
   'beforeFetch',
   'onResponseError',
   'onUnknownError',
] as const

export let buildOptions = <
   TUpData = any,
   TFetchData = TUpData,
   TUpResponseError = ResponseError,
   TUpUnknownError = any,
   TFetchResponseError = TUpResponseError,
   TFetchUnknownError = TUpUnknownError,
>(
   input: RequestInfo | URL, // fetch 1st arg
   upOpts: UpOptions<TUpData, TUpResponseError, TUpUnknownError> = {},
   fetcherOpts: FetchOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   > = {},
): UpFetchOptions<TFetchData, TFetchResponseError, TFetchUnknownError> =>
   ({
      ...(defaultOptions as DefaultOptions),
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
   } satisfies UpFetchOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >)
