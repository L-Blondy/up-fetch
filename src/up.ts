import { buildOptions } from './build-options'
import { ResponseError } from './response-error'
import { FetcherOptions, DefaultOptions, BaseFetchFn } from './types'
import { emptyOptions } from './utils'

export function up<
   TFetchFn extends BaseFetchFn,
   TDefaultOptions extends DefaultOptions<TFetchFn, any> = DefaultOptions<
      TFetchFn,
      ResponseError
   >,
>(
   fetchFn: TFetchFn,
   getDefaultOptions: () => TDefaultOptions = () => emptyOptions,
) {
   return <
      TParsedData = Awaited<
         ReturnType<NonNullable<TDefaultOptions['parseResponse']>>
      >,
      TData = TParsedData,
      TError = Awaited<
         ReturnType<NonNullable<TDefaultOptions['parseResponseError']>>
      >,
   >(
      input: Parameters<TFetchFn>[0],
      fetcherOptions:
         | FetcherOptions<TFetchFn, TData, TError, TParsedData>
         | ((
              defaultOptions: TDefaultOptions,
           ) => FetcherOptions<
              TFetchFn,
              TData,
              TError,
              TParsedData
           >) = emptyOptions,
      ctx?: Parameters<TFetchFn>[2],
   ) => {
      let defaultOpts = getDefaultOptions()
      let fetcherOpts =
         typeof fetcherOptions === 'function'
            ? fetcherOptions(defaultOpts)
            : fetcherOptions
      let options = buildOptions(input, defaultOpts, fetcherOpts)
      fetcherOpts.onBeforeFetch?.(options)
      defaultOpts.onBeforeFetch?.(options)

      return fetchFn(options.input, options, ctx)
         .catch((error) => {
            fetcherOpts.onRequestError?.(error, options)
            defaultOpts.onRequestError?.(error, options)
            throw error
         })
         .then(async (response) => {
            if (!(await options.throwResponseErrorWhen(response))) {
               let parsed: Awaited<TParsedData>
               try {
                  parsed = await options.parseResponse(response, options)
               } catch (error: any) {
                  fetcherOpts.onParsingError?.(error, options)
                  defaultOpts.onParsingError?.(error, options)
                  throw error
               }
               let data: Awaited<TData>
               try {
                  data = await options.transform(parsed, options)
               } catch (error: any) {
                  fetcherOpts.onTransformError?.(error, options)
                  defaultOpts.onTransformError?.(error, options)
                  throw error
               }
               fetcherOpts.onSuccess?.(data, options)
               defaultOpts.onSuccess?.(data, options)
               return data
            } else {
               let respError: Awaited<TError>
               try {
                  respError = await options.parseResponseError(
                     response,
                     options,
                  )
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
