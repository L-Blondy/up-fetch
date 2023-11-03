import { ResponseError } from './response-error.js'
import {
   BuiltOptions,
   DefaultOptions,
   FetcherOptions,
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

export let buildOptions = <
   TUpData = any,
   TFetcherData = TUpData,
   TUpError = ResponseError,
   TFetcherError = TUpError,
>(
   input: RequestInfo | URL, // fetch 1st arg
   upOpts: UpOptions<TUpData, TUpError> = {},
   fetcherOpts: FetcherOptions<TFetcherData, TFetcherError> = {},
): BuiltOptions<TFetcherData, TFetcherError> =>
   ({
      ...(defaultOptions as DefaultOptions),
      // TODO: strip some keys
      ...strip(upOpts),
      // TODO: strip some keys
      ...strip(fetcherOpts),
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
   } satisfies BuiltOptions<TFetcherData, TFetcherError>)

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
