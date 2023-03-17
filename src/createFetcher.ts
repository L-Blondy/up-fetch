import { buildOptions, Options } from './buildOptions'
import { buildUrl } from './buildUrl'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export interface SharedOptions<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string | URL
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   parseError?: (res: Response) => Promise<any>
   parseSuccess?: (response: Response) => Promise<D>
   serializeBody?: (body: PlainObject | Array<any>) => string
   serializeParams?: (params: RequestOptions['params']) => string
}

export interface DefaultOptions<DD = any> extends SharedOptions<DD> {
   onError?: (error: any) => void
   onFetchStart?: (options: Options, url: string) => void
   onSuccess?: (error: any) => void
}

export interface RequestOptions<D = any> extends SharedOptions<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export const createFetcher = <DD = any>(
   defaultOptions?: () => DefaultOptions<DD>,
   fetchFn: typeof fetch = fetch,
) => {
   return async <D = DD>(requestOptions?: RequestOptions<D>) => {
      const options = buildOptions(defaultOptions?.(), requestOptions)
      const url = buildUrl(options)

      options.onFetchStart(options, url)

      return await fetchFn(url, options)
         .then(async (res) => {
            if (res.ok) {
               const data: D = await options.parseSuccess(res)
               options.onSuccess(data)
               return data
            } else {
               throw await options.parseError(res)
            }
         })
         .catch((error) => {
            options.onError(error)
            throw error
         })
   }
}
