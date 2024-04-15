import { buildOptions } from './build-options.js'
import { ResponseError } from './response-error.js'
import { UpFetchOptions, UpOptions } from './types.js'
import { emptyOptions } from './utils.js'

export function up<
   TFetchFn extends typeof fetch,
   TUpOptions extends UpOptions<TFetchFn, any, any> = UpOptions<
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
      TUnexpectedError = ReturnType<
         NonNullable<TUpOptions['parseUnexpectedError']>
      >,
   >(
      input: RequestInfo | URL,
      upfetchOptions:
         | UpFetchOptions<TData, TResponseError, TUnexpectedError, TFetchFn>
         | ((
              upOptions: TUpOptions,
           ) => UpFetchOptions<
              TData,
              TResponseError,
              TUnexpectedError,
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
            try {
               throw options.parseUnexpectedError(error, options)
            } catch (error: any) {
               upFetchOpts.onUnexpectedError?.(error, options)
               upOptions.onUnexpectedError?.(error, options)
               upFetchOpts.onError?.(error, options)
               upOptions.onError?.(error, options)
               throw error
            }
         })
         .then(async (res) => {
            if (res.ok) {
               try {
                  let data = await options.parseResponse(res, options)
                  upFetchOpts.onSuccess?.(data, options)
                  upOptions.onSuccess?.(data, options)
                  return data
               } catch (error: any) {
                  upFetchOpts.onUnexpectedError?.(error, options)
                  upOptions.onUnexpectedError?.(error, options)
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
               } catch (error: any) {
                  upFetchOpts.onUnexpectedError?.(error, options)
                  upOptions.onUnexpectedError?.(error, options)
                  upFetchOpts.onError?.(error, options)
                  upOptions.onError?.(error, options)
                  throw error
               }
               throw responseError
            }
         })
   }
}
