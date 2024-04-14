import { buildOptions } from './build-options.js'
import { ResponseError } from './response-error.js'
import { UpFetchOptions, UpOptions } from './types.js'
import { emptyOptions } from './utils.js'

export function up<
   TFetchFn extends typeof fetch,
   TUpOptions extends UpOptions<TFetchFn> = UpOptions<
      TFetchFn,
      ResponseError,
      Error
   >,
>(fetchFn: TFetchFn, getUpOptions: () => TUpOptions = () => emptyOptions) {
   return <
      TData = Awaited<ReturnType<NonNullable<TUpOptions['parseResponse']>>>,
      TResponseError = Awaited<
         ReturnType<NonNullable<TUpOptions['parseResponseError']>>
      >,
      TRequestError = ReturnType<NonNullable<TUpOptions['parseRequestError']>>,
   >(
      input: RequestInfo | URL,
      upfetchOptions:
         | UpFetchOptions<TData, TResponseError, TRequestError, TFetchFn>
         | ((
              upOptions: TUpOptions,
           ) => UpFetchOptions<
              TData,
              TResponseError,
              TRequestError,
              TFetchFn
           >) = emptyOptions,
   ) => {
      let upOptions = getUpOptions()
      let upFetchOpts =
         typeof upfetchOptions === 'function'
            ? upfetchOptions(upOptions)
            : upfetchOptions
      let options = buildOptions(input, upOptions, upFetchOpts)
      upFetchOpts.onBeforeFetch?.(options)
      upOptions.onBeforeFetch?.(options)

      return fetchFn(options.input, options)
         .catch((error) => {
            let requestError: TRequestError
            try {
               requestError = options.parseRequestError(error, options)
               upFetchOpts.onRequestError?.(requestError, options)
               upOptions.onRequestError?.(requestError, options)
               upFetchOpts.onError?.(requestError, options)
               upOptions.onError?.(requestError, options)
            } catch (error: any) {
               upFetchOpts.onError?.(error, options)
               upOptions.onError?.(error, options)
               throw error
            }
            throw requestError
         })
         .then(async (res) => {
            if (res.ok) {
               try {
                  let data = await options.parseResponse(res, options)
                  upFetchOpts.onSuccess?.(data, options)
                  upOptions.onSuccess?.(data, options)
                  return data
               } catch (error) {
                  upFetchOpts.onError?.(error, options)
                  upOptions.onError?.(error, options)
                  throw error
               }
            } else {
               let responseError: Awaited<TResponseError>
               try {
                  responseError = await options.parseResponseError(res, options)
                  upFetchOpts.onResponseError?.(responseError, options)
                  upOptions.onResponseError?.(responseError, options)
                  upFetchOpts.onError?.(responseError, options)
                  upOptions.onError?.(responseError, options)
               } catch (error) {
                  upFetchOpts.onError?.(error, options)
                  upOptions.onError?.(error, options)
                  throw error
               }
               throw responseError
            }
         })
   }
}
