import { buildOptions } from './buildOptions.js'
import { withRetry } from './withRetry.js'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export type FetchLike<Init extends Record<string, any> = RequestInit> = (
   url: any,
   init?: Init,
) => Promise<Response>

export interface SharedOptions<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string | URL
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   parseSuccess?: (response: Response) => Promise<D> | D
   parseError?: (response: Response) => Promise<any>
   retryTimes?: number
   retryWhen?: (response: Response) => boolean
   retryDelay?: (attemptNumber: number, response: Response) => number
   serializeBody?: (body: PlainObject | Array<any>) => string
   serializeParams?: (params: FetcherOptions['params']) => string
   timeout?: number
}

export interface DefaultOptions<D = any> extends SharedOptions<D> {
   onError?: (error: any) => void
   onFetchStart?: (options: any) => void
   onSuccess?: (data: any, options: any) => void
}

export interface FetcherOptions<D = any> extends SharedOptions<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export type RequestOptions<DD, D> = ReturnType<typeof buildOptions<DD, D>>

export const createFetcher = <DD = any>(
   defaultOptions?: () => DefaultOptions<DD>,
   fetchFn: FetchLike = fetch,
) => {
   return <D = DD>(fetcherOptions?: FetcherOptions<D>) => {
      const options = buildOptions<DD, D>(defaultOptions?.(), fetcherOptions)

      options.onFetchStart?.(options)

      return withRetry(fetchFn)(options.href, options as any)
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
