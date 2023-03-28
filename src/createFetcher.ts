import { buildOptions } from './buildOptions.js'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export interface SharedOptions<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string | URL
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   parseSuccess?: (response: Response) => Promise<D> | D
   parseError?: (response: Response) => Promise<any>
   serializeBody?: (body: PlainObject | Array<any>) => string
   serializeParams?: (params: RequestOptions['params']) => string
}

export interface DefaultOptions<DD = any> extends SharedOptions<DD> {
   onError?: (error: any, options: MergedOptions<DD, any>) => void
   onFetchStart?: (options: MergedOptions<DD, any>) => void
   onSuccess?: (error: any, options: MergedOptions<DD, any>) => void
}

export interface RequestOptions<D = any> extends SharedOptions<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export type MergedOptions<DD, D> = ReturnType<typeof buildOptions<DD, D>>

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
      requestOptions?: RequestOptions<D> &
         Omit<Init, 'body' | 'method'> &
         Omit<RequestInit, 'body' | 'method'>,
   ) => {
      const options: MergedOptions<DD, D> = buildOptions<DD, D>(defaultOptions?.(), requestOptions)

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
