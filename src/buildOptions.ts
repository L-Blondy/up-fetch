import { ResponseError } from './ResponseError'
import { BuiltOptions, FetcherOptions, UpOptions } from './types'
import {
   getUrlFromInput,
   isJsonificable,
   mergeHeaders,
   searchToObject,
   strip,
   withQuestionMark,
} from './utils'

export const defaultOptions = {
   parseResponse: (res: Response) =>
      res
         .clone()
         .json()
         .catch(() => res.text())
         .then((data) => data || null),

   parseResponseError: async (
      res: Response,
      options: BuiltOptions,
   ): Promise<ResponseError> =>
      new ResponseError(res, await defaultOptions.parseResponse(res), options),

   serializeParams: (params: BuiltOptions['params']) =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params))).toString(),

   serializeBody: JSON.stringify,
}

export function buildOptions<
   TUpData = any,
   TFetcherData = TUpData,
   TUpError = ResponseError,
   TFetcherError = TUpError,
>(
   input: RequestInfo | URL, // fetch 1st arg
   upOpts?: UpOptions<TUpData, TUpError>,
   fetcherOpts?: FetcherOptions<TFetcherData, TFetcherError>,
): BuiltOptions<TFetcherData, TFetcherError> {
   const isBodyJson = isJsonificable(fetcherOpts?.body)

   const options: BuiltOptions = {
      ...defaultOptions,
      ...strip(upOpts),
      ...strip(fetcherOpts),
   } as any

   options.headers = mergeHeaders(
      isBodyJson ? { 'content-type': 'application/json' } : {},
      upOpts?.headers,
      fetcherOpts?.headers,
   )

   options.body = !isBodyJson
      ? options.body
      : options.serializeBody(
           fetcherOpts?.body as any,
           options,
           defaultOptions.serializeBody,
        )

   let url = getUrlFromInput(input, options.baseUrl)
   let search = url.search
   url.search = ''
   let href = url.href

   options.params = strip({
      ...upOpts?.params,
      ...searchToObject(search),
      ...fetcherOpts?.params,
   })

   let serializedParams = options.serializeParams(
      options.params,
      options,
      defaultOptions.serializeParams,
   )

   options.href = `${href}${withQuestionMark(serializedParams)}`

   return options
}

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
