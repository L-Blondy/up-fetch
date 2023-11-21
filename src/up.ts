import { buildOptions } from './build-options.js'
import { FetchOptions, UpOptions } from './types.js'

export function up<
   TFetchFn extends typeof fetch,
   TUpData = any,
   TUpResponseError = any,
   TUpUnknownError = any,
>(
   fetchFn: TFetchFn,
   getUpOptions: () => UpOptions<
      TUpData,
      TUpResponseError,
      TUpUnknownError
   > = () => ({}),
) {
   let fetcher = <
      TFetchData = TUpData,
      TFetchResponseError = TUpResponseError,
      TFetchUnknownError = TUpUnknownError,
   >(
      input: RequestInfo | URL,
      fetcherOptions: FetchOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      > = {},
   ) => {
      let upOptions = getUpOptions()
      let options = buildOptions(input, upOptions, fetcherOptions)

      fetcherOptions.beforeFetch?.(options)
      upOptions.beforeFetch?.(options)

      return fetchFn(options.input, options)
         .catch((error) => {
            let unknownError = options.parseUnknownError(error, options)
            fetcherOptions.onUnknownError?.(unknownError, options)
            upOptions.onUnknownError?.(unknownError, options)
            fetcherOptions.onError?.(unknownError, options)
            upOptions.onError?.(unknownError, options)
            throw unknownError
         })
         .then(async (res) => {
            if (res.ok) {
               let data = await options.parseResponse(res, options)
               fetcherOptions.onSuccess?.(data, options)
               upOptions.onSuccess?.(data, options)
               return data
            }
            let responseError = await options.parseResponseError(res, options)
            fetcherOptions.onResponseError?.(responseError, options)
            upOptions.onResponseError?.(responseError, options)
            fetcherOptions.onError?.(responseError, options)
            upOptions.onError?.(responseError, options)
            throw responseError
         })
   }

   return fetcher
}
