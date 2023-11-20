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
   isInputRequest,
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
            ? this.serializeBody(
                 this.rawBody,
                 this,
                 defaultOptions.serializeBody,
              )
            : this.rawBody
      },
      get input() {
         if (isInputRequest(input)) return input
         let url = new URL(input, this.baseUrl)
         let serializedParams = this.serializeParams(
            this.params,
            this,
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

const options = buildOptions(
   '',
   {
      parseResponse: (res, opts) => res.text(),
      parseResponseError: (res, opts) => res.text(),
      serializeParams(params, options, defaultSerializer) {
         return ''
      },
      serializeBody(body, options, defaultSerializer) {
         return ''
      },
   },
   {
      parseResponse: (res, opts) => Promise.resolve(1),
      parseResponseError: (res, opts) => Promise.resolve(1),
      serializeParams(params, options, defaultSerializer) {
         return ''
      },
      serializeBody(body, options, defaultSerializer) {
         return ''
      },
   },
)
type w = (typeof options)['parseResponse']
//   ^?
type x = (typeof options)['parseResponseError']
//   ^?
type h = (typeof options)['headers']
