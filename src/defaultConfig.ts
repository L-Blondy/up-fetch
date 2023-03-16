import { FactoryConfig, RequestConfig } from './createFetcher'
import { ResponseError } from './ResponseError'
import { withQuestionMark } from './withQuestionMark'

// all props have to be marked as optional in order to get Required<{...}> to strip undefined
// as for typescript 4.9.5
export type DefaultConfig = Required<{
   baseUrl?: FactoryConfig['baseUrl']
   headers?: RequestConfig['headers']
   onError?: FactoryConfig['onError']
   onSuccess?: FactoryConfig['onSuccess']
   onFetchStart?: FactoryConfig['onFetchStart']
   params?: RequestConfig['params']
   parseSuccess?: RequestConfig['parseSuccess']
   parseError?: (res: Response) => Promise<ResponseError<any>>
   serializeBody?: RequestConfig['serializeBody']
   serializeParams?: RequestConfig['serializeParams']
   url?: RequestConfig['url']
}>

export const defaultConfig: DefaultConfig = {
   baseUrl: '',
   headers: new Headers(),
   onError: () => {},
   onSuccess: () => {},
   onFetchStart: () => {},
   params: {},
   parseSuccess: async <T = any>(res: Response) => {
      return (await res
         .clone()
         .json()
         .catch(() => res.clone().text())) as T
   },
   parseError: async (res: Response) => {
      const data = await res
         .clone()
         .json()
         .catch(() => res.clone().text())

      return new ResponseError(res, data)
   },
   serializeBody: (body: object | any[]) => JSON.stringify(body),
   serializeParams: (params?: DefaultConfig['params']): string => {
      // recursively transforms Dates to ISO string and strips undefined
      const clean = JSON.parse(JSON.stringify(params))
      return withQuestionMark(new URLSearchParams(clean).toString())
   },
   url: '',
}
