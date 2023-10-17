import { ResponseError } from './ResponseError'
import { BuiltOptions, FetcherOptions, ParseResponse, UpOptions } from './types'
import { utils } from './utils'

const defaultOptions = {
   parseResponse: utils.parseResponse,
   parseResponseError: utils.parseResponseError,
}

export function buildOptions<
   TUpData = any,
   TFetcherData = TUpData,
   TUpError = ResponseError,
   TFetcherError = TUpError,
>(
   upOpts?: UpOptions<TUpData, TUpError>,
   fetcherOpts?: FetcherOptions<TFetcherData, TFetcherError>,
): BuiltOptions<TFetcherData, TFetcherError> {
   return {
      parseResponse:
         fetcherOpts?.parseResponse ||
         (upOpts?.parseResponse as any) ||
         defaultOptions.parseResponse,
      parseResponseError:
         fetcherOpts?.parseResponseError ||
         (upOpts?.parseResponseError as any) ||
         defaultOptions.parseResponseError,
   }
}
const options = buildOptions(
   { parseResponse: (res, opts) => res.text(), parseResponseError: (res, opts) => res.text() },
   {
      parseResponse: (res, opts) => Promise.resolve(1),
      parseResponseError: (res, opts) => Promise.resolve(1),
   },
)
type w = (typeof options)['parseResponse']
//   ^?
type x = (typeof options)['parseResponseError']
//   ^?
