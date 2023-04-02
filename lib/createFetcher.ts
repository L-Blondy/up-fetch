import { buildOptions } from './buildOptions.js'
import { ResponseError } from './ResponseError.js'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export type FetchLike<Init extends Record<string, any> = RequestInit> = (
   url: any,
   init?: Init,
) => Promise<Response>

export interface SharedOptions<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string
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
   onError?: (error: ResponseError) => void
   onFetchStart?: (options: RequestOptions<any, any>) => void
   onSuccess?: (data: any, options: RequestOptions<any, any>) => void
}

export interface FetcherOptions<D = any> extends SharedOptions<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export type RequestOptions<DD = any, D = DD> = ReturnType<typeof buildOptions<DD, D>>

export let createFetcher =
   <DD = any>(defaultOptions?: () => DefaultOptions<DD>, fetchFn: FetchLike = fetch) =>
   <D = DD>(fetcherOptions?: FetcherOptions<D>) => {
      let options = buildOptions<DD, D>(defaultOptions?.(), fetcherOptions)

      options.onFetchStart?.(options)

      return withRetry(fetchFn)(options.href, options)
         .then(async (res) => {
            if (res.ok) {
               let data = (await options.parseSuccess(res)) as D
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

let waitFor = (ms = 0, signal?: AbortSignal | null) =>
   new Promise<void>((resolve, reject) => {
      let timeoutId = setTimeout(resolve, ms)
      signal?.addEventListener('abort', () => {
         clearTimeout(timeoutId)
         reject(new DOMException('Request cancelled.', 'AbortError'))
      })
   })

export let withRetry = <F extends FetchLike>(fetchFn: F) =>
   async function fetcher(
      url: string,
      opts: RequestOptions<any, any>,
      count = 0,
   ): Promise<Response> {
      let res = await fetchFn(url, opts)
      return res.ok || count === opts.retryTimes || !opts.retryWhen?.(res)
         ? res
         : waitFor(opts.retryDelay(++count, res), opts.signal).then(() => fetcher(url, opts, count))
   }
