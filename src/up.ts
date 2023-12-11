import { buildOptions } from './build-options.js'
import { defaultOptions } from './default-options.js'
import { ComputedOptions, UpFetchOptions, UpOptions } from './types.js'
import { emptyOptions } from './utils.js'

// TODO: test function upfetch options
// TODO: validationStrategy

export function up<TFetchFn extends typeof fetch, TUpOptions extends UpOptions>(
   fetchFn: TFetchFn,
   getUpOptions: () => TUpOptions = () => emptyOptions,
) {
   return <
      TFetchData = Awaited<
         ReturnType<NonNullable<TUpOptions['parseResponse']>>
      >,
      TFetchResponseError = Awaited<
         ReturnType<NonNullable<TUpOptions['parseResponseError']>>
      >,
      TFetchUnknownError = ReturnType<
         NonNullable<TUpOptions['parseUnknownError']>
      >,
   >(
      input: RequestInfo | URL,
      upfetchOptions:
         | UpFetchOptions<
              TFetchData,
              TFetchResponseError,
              TFetchUnknownError,
              TFetchFn
           >
         | ((
              upOptions: TUpOptions,
           ) => UpFetchOptions<
              TFetchData,
              TFetchResponseError,
              TFetchUnknownError,
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
            handleUnknownError<TFetchUnknownError>(
               error,
               options,
               upOptions,
               upFetchOpts,
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
                  upFetchOpts.onSuccess?.(data, options)
                  upOptions.onSuccess?.(data, options)
                  return data
               } catch (error) {
                  handleUnknownError<TFetchUnknownError>(
                     error,
                     options,
                     upOptions,
                     upFetchOpts,
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
                  upFetchOpts,
               )
            }
            upFetchOpts.onResponseError?.(responseError, options)
            upOptions.onResponseError?.(responseError, options)
            upFetchOpts.onError?.(responseError, options)
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
