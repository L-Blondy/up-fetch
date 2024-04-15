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
      let upfetchOpts =
         typeof upfetchOptions === 'function'
            ? upfetchOptions(upOptions)
            : upfetchOptions
      let options = buildOptions(input, upOptions, upfetchOpts)
      upfetchOpts.onBeforeFetch?.(options)
      upOptions.onBeforeFetch?.(options)

      function handleUnexpectedError(error: any) {
         upfetchOpts.onUnexpectedError?.(error, options)
         upOptions.onUnexpectedError?.(error, options)
         upfetchOpts.onError?.(error, options)
         upOptions.onError?.(error, options)
         return error
      }

      return fetchFn(options.input, options)
         .catch((error) => {
            try {
               throw options.parseUnexpectedError(error, options)
            } catch (error: any) {
               throw handleUnexpectedError(error)
            }
         })
         .then(async (res) => {
            if (res.ok) {
               try {
                  let data = await options.parseResponse(res, options)
                  upfetchOpts.onSuccess?.(data, options)
                  upOptions.onSuccess?.(data, options)
                  return data
               } catch (error: any) {
                  throw handleUnexpectedError(error)
               }
            } else {
               let responseError: Awaited<TResponseError>
               try {
                  responseError = await options.parseResponseError(res, options)
                  upfetchOpts.onResponseError?.(responseError, options)
                  upOptions.onResponseError?.(responseError, options)
                  upfetchOpts.onError?.(responseError, options)
                  upOptions.onError?.(responseError, options)
               } catch (error: any) {
                  throw handleUnexpectedError(error)
               }
               throw responseError
            }
         })
   }
}
