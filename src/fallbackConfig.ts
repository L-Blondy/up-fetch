import { DefaultConfig, RequestConfig } from './createFetcher'
import { ResponseError } from './ResponseError'
import { withQuestionMark } from './withQuestionMark'

export type FallbackConfig = Required<
   Pick<DefaultConfig, 'onError' | 'onFetchStart' | 'onSuccess'> &
      Pick<
         RequestConfig,
         | 'baseUrl'
         | 'headers'
         | 'params'
         | 'parseError'
         | 'parseSuccess'
         | 'serializeBody'
         | 'serializeParams'
         | 'url'
      >
>

export const fallbackConfig: FallbackConfig = {
   baseUrl: '',
   headers: new Headers(),
   onError: () => {},
   onSuccess: () => {},
   onFetchStart: () => {},
   params: {},
   parseSuccess: async (res: Response) => {
      return await res
         .clone()
         .json()
         .catch(() => res.clone().text())
   },
   parseError: async (res: Response) => {
      const data = await res
         .clone()
         .json()
         .catch(() => res.clone().text())

      return new ResponseError(res, data)
   },
   serializeBody: (body: object | any[]) => JSON.stringify(body),
   serializeParams: (params?: FallbackConfig['params']): string => {
      // recursively transforms Dates to ISO string and strips undefined
      const clean = JSON.parse(JSON.stringify(params))
      return withQuestionMark(new URLSearchParams(clean).toString())
   },
   url: '',
}