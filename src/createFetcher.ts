import { buildOptions } from './buildOptions.js'
import { ResponseError } from './ResponseError.js'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export interface SharedOptions<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string | URL
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   parseResponseOk?: (response: Response) => Promise<D>
   serializeBody?: (body: PlainObject | Array<any>) => string
   serializeParams?: (params: RequestOptions['params']) => string
}

export interface DefaultOptions<DD = any> extends SharedOptions<DD> {
   onError?: (error: any) => void
   onFetchStart?: (options: ReturnType<typeof buildOptions>) => void
   onSuccess?: (error: any) => void
}

export interface RequestOptions<D = any> extends SharedOptions<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export type FinalOptions = ReturnType<typeof buildOptions>

export const createFetcher = <DD = any>(
   defaultOptions?: () => DefaultOptions<DD>,
   fetchFn: typeof fetch = fetch,
) => {
   return async <D = DD>(requestOptions?: RequestOptions<D>) => {
      const options = buildOptions(defaultOptions?.(), requestOptions)

      options.onFetchStart?.(options)

      return await fetchFn(options.href, options)
         .then(async (res) => {
            if (res.ok) {
               const data: D = await options.parseResponseOk(res)
               options.onSuccess?.(data)
               return data
            } else {
               throw await parseError(res)
            }
         })
         .catch((error) => {
            options.onError?.(error)
            throw error
         })
   }
}

export async function parseError(res: Response) {
   const data = await res
      .clone()
      .json()
      .catch(() => res.text())

   return new ResponseError(res, data)
}
