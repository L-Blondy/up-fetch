import { buildOptions, fallbackOptions } from './buildOptions.js'
import { ResponseError } from './ResponseError.js'

// TODO: add logic to merge params
// TODO: add tests for params (string & object)

export type FetchLike<Init extends Record<string, any> = RequestInit> = (
   url: any,
   init?: Init,
) => Promise<Response>

export interface SharedOptions<D = any> extends Omit<RequestInit, 'body' | 'method' | 'headers'> {
   baseUrl?: string
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   headers?: RequestInit['headers'] | Record<string, string | null | undefined>
   params?: Record<string, any>
   parseResponse?: (
      response: Response,
      options: RequestOptions,
      defaultParser: (typeof fallbackOptions)['parseResponse'],
   ) => Promise<D> | D
   parseThrownResponse?: (
      response: Response,
      options: RequestOptions,
      defaultParser: (typeof fallbackOptions)['parseThrownResponse'],
   ) => Promise<any> | any
   retryTimes?: number
   retryWhen?: (response: Response, options: RequestOptions) => boolean
   retryDelay?: (attemptNumber: number, response: Response) => number
   serializeBody?: (
      body: Exclude<FetcherOptions['body'], BodyInit | null | undefined>,
      options: RequestOptions,
      defaultSerializer: (typeof fallbackOptions)['serializeBody'],
   ) => string
   serializeParams?: (
      params: Exclude<FetcherOptions['params'], null | undefined>,
      options: RequestOptions,
      defaultSerializer: (typeof fallbackOptions)['serializeParams'],
   ) => string
   throwWhen?: (response: Response, options: RequestOptions) => boolean | Promise<boolean>
}

export interface DefaultOptions<D = any> extends SharedOptions<D> {
   onError?: (error: ResponseError) => void
   beforeFetch?: (options: RequestOptions) => void
   onSuccess?: (data: any, options: RequestOptions) => void
}

export interface FetcherOptions<D = any> extends SharedOptions<D> {
   url?: string
   body?: BodyInit | Record<string, any> | Array<any> | null
}

type RequestOptionsRequiredKeys =
   | 'parseThrownResponse'
   | 'parseResponse'
   | 'retryDelay'
   | 'retryWhen'
   | 'serializeBody'
   | 'serializeParams'
   | 'headers'
   | 'params'
   | 'throwWhen'

export interface RequestOptions<DD = any, D = DD>
   extends Omit<RequestInit, RequestOptionsRequiredKeys>,
      Omit<DefaultOptions<DD>, RequestOptionsRequiredKeys | keyof RequestInit>,
      Omit<FetcherOptions<D>, RequestOptionsRequiredKeys | keyof RequestInit>,
      Pick<Required<SharedOptions>, RequestOptionsRequiredKeys> {
   headers: Headers
   href: string
}

export let createFetcher =
   <DD = any>(defaultOptions?: () => DefaultOptions<DD>, fetchFn: FetchLike = fetch) =>
   <D = DD>(fetcherOptions?: FetcherOptions<D>) => {
      let options = buildOptions<DD, D>(defaultOptions?.(), fetcherOptions)

      options.beforeFetch?.(options)

      return withRetry(fetchFn)(options.href, options)
         .then(async (res) => {
            let shouldThrow = await options.throwWhen(res.clone(), options)
            if (!shouldThrow) {
               let data = (await options.parseResponse(
                  res,
                  options,
                  fallbackOptions.parseResponse,
               )) as D
               options.onSuccess?.(data, options)
               return data
            } else {
               throw await options.parseThrownResponse(
                  res,
                  options,
                  fallbackOptions.parseThrownResponse,
               )
            }
         })
         .catch((error) => {
            options.onError?.(error)
            throw error
         })
   }

let waitFor = (ms = 0, signal?: AbortSignal | null) =>
   new Promise<void>((resolve, reject) => {
      let timeoutId = setTimeout(timeoutCb, ms)
      function abortCb() {
         clearTimeout(timeoutId)
         reject(new DOMException('Request cancelled.', 'AbortError'))
      }
      function timeoutCb() {
         signal?.removeEventListener('abort', abortCb)
         resolve()
      }
      signal?.addEventListener('abort', abortCb)
   })

export let withRetry = <F extends FetchLike>(fetchFn: F) =>
   async function fetcher(url: string, opts: RequestOptions, count = 0): Promise<Response> {
      let res = await fetchFn(url, opts)
      let shouldThrow = await opts.throwWhen(res.clone(), opts)
      return !shouldThrow || count === (opts.retryTimes || 0) || !opts.retryWhen(res, opts)
         ? res
         : waitFor(opts.retryDelay(++count, res), opts.signal).then(() => fetcher(url, opts, count))
   }
