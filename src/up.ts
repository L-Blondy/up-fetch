import { buildOptions } from './build-options.js'
import { FetcherOptions, UpOptions } from './types.js'

export function up<
   TFetchFn extends typeof fetch,
   TUpData = any,
   TUpError = any,
>(fetchFn: TFetchFn, upOptions?: UpOptions<TUpData, TUpError>) {
   return <TFetcherData = any, TFetcherError = any>(
      input: RequestInfo | URL,
      fetcherOptions?: FetcherOptions<TFetcherData, TFetcherError>,
   ) => {
      let options = buildOptions(input, upOptions, fetcherOptions)

      options.beforeFetch?.(options)

      return fetchFn(options.input, options)
         .then(async (res) => {
            if (!res.ok) {
               let data = await options.parseResponse(res, options)
               options.onSuccess?.(data, options)
               return data
            } else {
               throw await options.parseResponseError(res, options)
            }
         })
         .catch((error) => {
            options.onError?.(error, options)
            throw error
         })
   }
}
