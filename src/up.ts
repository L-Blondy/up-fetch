import { buildOptions } from './build-options'
import { ResponseError } from './response-error'
import { FetcherOptions, DefaultOptions } from './types'
import { emptyOptions } from './utils'

export function up<
   TFetchFn extends typeof fetch,
   TDefaultOptions extends DefaultOptions<TFetchFn, any> = DefaultOptions<
      TFetchFn,
      ResponseError
   >,
>(
   fetchFn: TFetchFn,
   getDefaultOptions: () => TDefaultOptions = () => emptyOptions,
) {
   return <
      TData = Awaited<
         ReturnType<NonNullable<TDefaultOptions['parseResponse']>>
      >,
      TResponseError = Awaited<
         ReturnType<NonNullable<TDefaultOptions['parseResponseError']>>
      >,
   >(
      input: RequestInfo | URL,
      fetcherOptions:
         | FetcherOptions<TData, TResponseError, TFetchFn>
         | ((
              defaultOptions: TDefaultOptions,
           ) => FetcherOptions<TData, TResponseError, TFetchFn>) = emptyOptions,
   ) => {
      let defaultOptions = getDefaultOptions()
      let fetcherOptions =
         typeof fetcherOptions === 'function'
            ? fetcherOptions(defaultOptions)
            : fetcherOptions
      let options = buildOptions(input, defaultOptions, fetcherOptions)
      fetcherOptions.onBeforeFetch?.(options)
      defaultOptions.onBeforeFetch?.(options)

      return fetchFn(options.input, options)
         .catch((error) => {
            fetcherOptions.onRequestError?.(error, options)
            defaultOptions.onRequestError?.(error, options)
            throw error
         })
         .then(async (res) => {
            if (res.ok) {
               let data: Awaited<TData>
               try {
                  data = await options.parseResponse(res, options)
               } catch (error: any) {
                  fetcherOptions.onParsingError?.(error, options)
                  defaultOptions.onParsingError?.(error, options)
                  throw error
               }
               fetcherOptions.onSuccess?.(data, options)
               defaultOptions.onSuccess?.(data, options)
               return data
            } else {
               let respError: Awaited<TResponseError>
               try {
                  respError = await options.parseResponseError(res, options)
               } catch (error: any) {
                  fetcherOptions.onParsingError?.(error, options)
                  defaultOptions.onParsingError?.(error, options)
                  throw error
               }
               fetcherOptions.onResponseError?.(respError, options)
               defaultOptions.onResponseError?.(respError, options)
               throw respError
            }
         })
   }
}
