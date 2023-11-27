import { buildOptions } from './build-options.js'
import { defaultOptions } from './default-options.js'
import { ComputedOptions, UpFetchOptions, UpOptions } from './types.js'
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
      upfetchOptions: UpFetchOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError,
         TFetchFn
      > = emptyOptions,
   ) => {
      let upOptions = getUpOptions()
      let options = buildOptions(input, upOptions, upfetchOptions)
      upfetchOptions.onBeforeFetch?.(options)
      upOptions.onBeforeFetch?.(options)

      return fetchFn(options.input, options)
         .catch((error) => {
            handleUnknownError<TFetchUnknownError>(
               error,
               options,
               upOptions,
               upfetchOptions,
            )
         })
         .then(async (res) => {
            if (res.ok) {
               try {
                  let data = await options.parseResponse(
                     res,
                     options,
                     defaultOptions.parseResponse,
                  )
                  upfetchOptions.onSuccess?.(data, options)
                  upOptions.onSuccess?.(data, options)
                  return data
               } catch (error) {
                  handleUnknownError<TFetchUnknownError>(
                     error,
                     options,
                     upOptions,
                     upfetchOptions,
                  )
               }
            }
            let responseError: TFetchResponseError
            try {
               responseError = await options.parseResponseError(
                  res,
                  options,
                  defaultOptions.parseResponseError,
               )
            } catch (error) {
               handleUnknownError<TFetchUnknownError>(
                  error,
                  options,
                  upOptions,
                  upfetchOptions,
               )
            }
            upfetchOptions.onResponseError?.(responseError, options)
            upOptions.onResponseError?.(responseError, options)
            upfetchOptions.onError?.(responseError, options)
            upOptions.onError?.(responseError, options)
            throw responseError
         })
   }
}

function handleUnknownError<TFetchUnknownError>(
   error: any,
   options: ComputedOptions,
   upOptions: UpOptions,
   upfetchOptions: UpFetchOptions,
): never {
   let unknownError: TFetchUnknownError
   try {
      unknownError = options.parseUnknownError(error, options)
   } catch (parsingError: any) {
      unknownError = parsingError
   }
   upfetchOptions.onUnknownError?.(unknownError, options)
   upOptions.onUnknownError?.(unknownError, options)
   upfetchOptions.onError?.(unknownError, options)
   upOptions.onError?.(unknownError, options)
   throw unknownError
}
