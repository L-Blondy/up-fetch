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
      let defaultOpts = getDefaultOptions()
      let fetcherOpts =
         typeof fetcherOptions === 'function'
            ? fetcherOptions(defaultOpts)
            : fetcherOptions
      let options = buildOptions(input, defaultOpts, fetcherOpts)
      fetcherOpts.onBeforeFetch?.(options)
      defaultOpts.onBeforeFetch?.(options)

      return fetchFn(options.input, options)
         .catch((error) => {
            fetcherOpts.onRequestError?.(error, options)
            defaultOpts.onRequestError?.(error, options)
            throw error
         })
         .then(async (res) => {
            if (res.ok) {
               let data: Awaited<TData>
               try {
                  data = await options.parseResponse(res, options)
               } catch (error: any) {
                  fetcherOpts.onParsingError?.(error, options)
                  defaultOpts.onParsingError?.(error, options)
                  throw error
               }
               fetcherOpts.onSuccess?.(data, options)
               defaultOpts.onSuccess?.(data, options)
               return data
            } else {
               let respError: Awaited<TResponseError>
               try {
                  respError = await options.parseResponseError(res, options)
               } catch (error: any) {
                  fetcherOpts.onParsingError?.(error, options)
                  defaultOpts.onParsingError?.(error, options)
                  throw error
               }
               fetcherOpts.onResponseError?.(respError, options)
               defaultOpts.onResponseError?.(respError, options)
               throw respError
            }
         })
   }
}
