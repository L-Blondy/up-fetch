import { ResponseError } from './response-error.js'
import { BuiltOptions, FetcherOptions, UpOptions } from './types.js'
import { defaultOptions } from './default-options.js'
import {
   isInputRequest,
   isJsonifiableObjectOrArray,
   mergeHeaders,
   strip,
   withPrefix,
} from './utils.js'

type DefaultOptionsTypeOverride = Pick<
   Required<UpOptions>,
   'parseResponse' | 'parseResponseError' | 'serializeParams' | 'serializeBody'
>

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
      ...(defaultOptions as any as DefaultOptionsTypeOverride),
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
      params: isInputRequest(input)
         ? // since the params cannot be used if the input is the Request,
           // they are set to an empty object for clarity
           {}
         : strip({
              // the url.search should override the defaultParams
              ...strip(upOpts.params, [
                 ...new URL(input, 'http://a').searchParams.keys(),
              ]),
              ...fetcherOpts.params,
           }),
      rawBody: fetcherOpts.body,
      get body() {
         return isJsonifiableObjectOrArray(options.rawBody)
            ? options.serializeBody(
                 options.rawBody,
                 options,
                 defaultOptions.serializeBody,
              )
            : options.rawBody
      },
      get input() {
         if (isInputRequest(input)) return input
         let url = new URL(input, options.baseUrl)
         let serializedParams = options.serializeParams(
            options.params,
            options,
            defaultOptions.serializeParams,
         )
         return `${url.href}${withPrefix(
            url.search ? '&' : '?',
            serializedParams,
         )}`
      },
   } satisfies BuiltOptions)

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
