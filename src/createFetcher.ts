import { buildOptions } from './buildOptions.js'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export type FetchLike<AdditionalOptions extends Record<string, any> = {}> = (
   url: any,
   init?: RequestInit & AdditionalOptions,
) => Promise<Response>

export interface SharedOptions<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string | URL
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   parseSuccess?: (response: Response) => Promise<D> | D
   parseError?: (response: Response) => Promise<any>
   serializeBody?: (body: PlainObject | Array<any>) => string
   serializeParams?: (params: FetcherOptions['params']) => string
}

export type DefaultOptions<
   AdditionalOptions extends Record<string, any> = {},
   DD = any,
> = SharedOptions<DD> &
   Omit<AdditionalOptions, 'body' | 'method'> &
   Omit<RequestInit, 'body' | 'method'> & {
      onError?: (error: any) => void
      onFetchStart?: (options: any) => void
      onSuccess?: (data: any, options: any) => void
   }

export type FetcherOptions<AdditionalOptions = {}, D = any> = SharedOptions<D> &
   Omit<AdditionalOptions, 'body' | 'method'> &
   Omit<RequestInit, 'body' | 'method'> & {
      url?: string
      params?: string | Record<string, ParamValue | ParamValue[]>
      body?: BodyInit | PlainObject | Array<any> | null
   }

export type RequestOptions<AdditionalOptions extends Record<string, any>, DD, D> = ReturnType<
   typeof buildOptions<AdditionalOptions, DD, D>
>

export const createFetcher = <DD = any, AdditionalOptions extends Record<string, any> = {}>(
   defaultOptions?: () => DefaultOptions<AdditionalOptions, DD>,
   fetchFn: FetchLike<AdditionalOptions> = fetch,
) => {
   return <D = DD>(fetcherOptions?: FetcherOptions<AdditionalOptions, D>) => {
      const options = buildOptions<AdditionalOptions, DD, D>(defaultOptions?.(), fetcherOptions)

      options.onFetchStart?.(options)

      return fetchFn(options.href, options as any)
         .then(async (res) => {
            if (res.ok) {
               const data = (await options.parseSuccess(res)) as D
               options.onSuccess?.(data, options)
               return data
            } else {
               throw await options.parseError(res)
            }
         })
         .catch((error) => {
            options.onError?.(error)
            throw error
         })
   }
}

// import { withRetry } from './plugins/withRetry.js'

// createFetcher(
//    () => ({
//       onFetchStart: (options) => {
//          console.log(options.)
//       },
//       cache: 'force-cache',

//    }),
//    withRetry(fetch),
// )({
//    retryDelay: () => 5000,
// })

// const y: FetcherOptions<{ a: number }> = {
//    a: 31,
// }
