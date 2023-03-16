import { buildConfig, Config } from './buildConfig'
import { buildUrl } from './buildUrl'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export interface SharedConfig<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string | URL
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   parseError?: (res: Response) => Promise<any>
   parseSuccess?: (response: Response) => Promise<D>
   serializeBody?: (body: PlainObject | Array<any>) => string
   serializeParams?: (params: RequestConfig['params']) => string
}

export interface DefaultConfig<DD = any> extends SharedConfig<DD> {
   onError?: (error: any) => void
   onFetchStart?: (config: Config, url: string) => void
   onSuccess?: (error: any) => void
}

export interface RequestConfig<D = any> extends SharedConfig<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export const createFetcher = <DD = any>(
   defaultConfig?: () => DefaultConfig<DD>,
   fetchFn: typeof fetch = fetch,
) => {
   return async <D = DD>(requestConfig?: RequestConfig<D>) => {
      const config = buildConfig(defaultConfig?.(), requestConfig)
      const url = buildUrl(config)

      config.onFetchStart(config, url)

      return await fetchFn(url, config)
         .then(async (res) => {
            if (res.ok) {
               const data: D = await config.parseSuccess(res)
               config.onSuccess(data)
               return data
            } else {
               throw await config.parseError(res)
            }
         })
         .catch((error) => {
            config.onError(error)
            throw error
         })
   }
}
