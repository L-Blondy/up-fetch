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
   onFetchStart?: (mergedOptions: MergedOptions<DD, any>) => void
   onSuccess?: (error: any) => void
}

export interface RequestOptions<D = any> extends SharedOptions<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export type MergedOptions<DD, D> = ReturnType<typeof buildOptions<DD, D>>

export const createFetcher = <DD = any>(
   defaultOptions?: () => DefaultOptions<DD>,
   fetchFn: typeof fetch = fetch,
) => {
   return async <D = DD>(requestOptions?: RequestOptions<D>) => {
      const mergedOptions: MergedOptions<DD, D> = buildOptions<DD, D>(
         defaultOptions?.(),
         requestOptions,
      )

      mergedOptions.onFetchStart?.(mergedOptions)

      return await fetchFn(mergedOptions.href, mergedOptions)
         .then(async (res) => {
            if (res.ok) {
               const data = (await mergedOptions.parseResponseOk(res)) as D
               mergedOptions.onSuccess?.(data)
               return data
            } else {
               throw await parseError(res)
            }
         })
         .catch((error) => {
            mergedOptions.onError?.(error)
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
