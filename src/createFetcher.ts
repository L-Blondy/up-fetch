import { buildOptions } from './buildOptions.js'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export interface SharedOptions<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string | URL
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   parseSuccess?: (response: Response) => Promise<D> | D
   parseError?: (response: Response) => Promise<any>
   serializeBody?: (body: PlainObject | Array<any>) => string
   serializeParams?: (params: FetcherOptions['params']) => string
}

export interface DefaultOptions<DD = any> extends SharedOptions<DD> {
   onError?: (error: any, options: RequestOptions<DD, any>) => void
   onFetchStart?: (options: RequestOptions<DD, any>) => void
   onSuccess?: (error: any, options: RequestOptions<DD, any>) => void
}

export interface FetcherOptions<D = any> extends SharedOptions<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export type RequestOptions<DD, D> = ReturnType<typeof buildOptions<DD, D>>

export type FetchLike<Init extends Record<string, any>> = (
   url: any,
   init?: RequestInit & Init,
) => Promise<Response>

export const createFetcher = <DD = any, Init extends Record<string, any> = {}>(
   defaultOptions?: () => DefaultOptions<DD> &
      Omit<Init, 'body' | 'method'> &
      Omit<RequestInit, 'body' | 'method'>,
   fetchFn: FetchLike<Init> = fetch,
) => {
   return <D = DD>(
      fetcherOptions?: FetcherOptions<D> &
         Omit<Init, 'body' | 'method'> &
         Omit<RequestInit, 'body' | 'method'>,
   ) => {
      const options: RequestOptions<DD, D> = buildOptions<DD, D>(defaultOptions?.(), fetcherOptions)

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
            options.onError?.(error, options)
            throw error
         })
   }
}
