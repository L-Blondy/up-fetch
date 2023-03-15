import { FactoryConfig, UpfetchConfig } from './createFetcher'
import { ResponseError } from './ResponseError'
import { withQuestionMark } from './withQuestionMark'

// all props have to be marked as optional in order to get Required<{...}> to strip undefined
// as for typescript 4.9.5
export type DefaultConfig = Required<{
   baseUrl?: FactoryConfig['baseUrl']
   headers?: UpfetchConfig['headers']
   onError?: FactoryConfig['onError']
   onSuccess?: FactoryConfig['onSuccess']
   params?: UpfetchConfig['params']
   parseSuccess?: UpfetchConfig['parseSuccess']
   parseError?: (res: Response) => Promise<ResponseError<any>>
   serializeBody?: UpfetchConfig['serializeBody']
   serializeParams?: UpfetchConfig['serializeParams']
   url?: UpfetchConfig['url']
}>

const defaultParser = async <T = any>(res: Response) => {
   return (await res
      .clone()
      .json()
      .catch(() => res.clone().text())) as T
}

export const defaultConfig: DefaultConfig = {
   baseUrl: '',
   headers: new Headers(),
   onError: () => {},
   onSuccess: () => {},
   params: {},
   parseSuccess: defaultParser,
   parseError: defaultParser,
   serializeBody: (body: object | any[]) => JSON.stringify(body),
   serializeParams: (params?: DefaultConfig['params']): string => {
      // recursively transforms Dates to ISO string and strips undefined
      const clean = JSON.parse(JSON.stringify(params))
      return withQuestionMark(new URLSearchParams(clean).toString())
   },
   url: '',
}
