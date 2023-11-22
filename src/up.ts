import { buildOptions } from './build-options.js'
import { defaultOptions } from './default-options.js'
import { UpFetchOptions, UpOptions } from './types.js'
import { emptyOptions } from './utils.js'

export function up<
   TUpData = any,
   TUpResponseError = any,
   TUpUnknownError = any,
   TFetchFn extends typeof fetch = typeof fetch,
>(
   fetchFn: TFetchFn,
   getUpOptions: () => UpOptions<
      TUpData,
      TUpResponseError,
      TUpUnknownError,
      TFetchFn
   > = () => emptyOptions,
) {
   return <
      TFetchData = TUpData,
      TFetchResponseError = TUpResponseError,
      TFetchUnknownError = TUpUnknownError,
   >(
      input: RequestInfo | URL,
      fetcherOptions: UpFetchOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError,
         TFetchFn
      > = emptyOptions,
   ) => {
      let upOptions = getUpOptions()
      let options = buildOptions(input, upOptions, fetcherOptions)
      fetcherOptions.onBeforeFetch?.(options)
      upOptions.onBeforeFetch?.(options)

      return fetchFn(options.input, options)
         .catch((error) => {
            let unknownError: TFetchUnknownError
            try {
               unknownError = options.parseUnknownError(error, options)
            } catch (e: any) {
               unknownError = e
            }
            fetcherOptions.onUnknownError?.(unknownError, options)
            upOptions.onUnknownError?.(unknownError, options)
            fetcherOptions.onError?.(unknownError, options)
            upOptions.onError?.(unknownError, options)
            throw unknownError
         })
         .then(async (res) => {
            if (res.ok) {
               let data = await options.parseResponse(
                  res,
                  options,
                  defaultOptions.parseResponse,
               )
               fetcherOptions.onSuccess?.(data, options)
               upOptions.onSuccess?.(data, options)
               return data
            }
            let responseError = await options.parseResponseError(
               res,
               options,
               defaultOptions.parseResponseError,
            )
            fetcherOptions.onResponseError?.(responseError, options)
            upOptions.onResponseError?.(responseError, options)
            fetcherOptions.onError?.(responseError, options)
            upOptions.onError?.(responseError, options)
            throw responseError
         })
   }
}
