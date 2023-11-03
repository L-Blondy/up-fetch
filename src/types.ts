import { ResponseError } from './response-error.js'

export type JsonifiableObject =
   | {
        [Key in string]?: JsonPrimitive | JsonifiableObject | JsonifiableArray
     }
   | {
        toJSON: () => JsonPrimitive | JsonifiableObject | JsonifiableArray
     }
export type JsonifiableArray = readonly (
   | JsonPrimitive
   | JsonifiableObject
   | JsonifiableArray
)[]
type JsonPrimitive = string | number | boolean | null

type Init = Omit<RequestInit, 'body' | 'headers' | 'method'>

export type ParseResponse<TData> = (
   response: Response,
   options: BuiltOptions,
) => Promise<TData>

export type ParseResponseError<TError = any> = (
   res: Response,
   options: BuiltOptions,
) => Promise<TError>

export type BuiltOptions<TData = any, TError = any> = Init & {
   parseResponse: ParseResponse<TData>
   parseResponseError: ParseResponseError<TError>
   readonly input: Request | string
   baseUrl?: string
   params: Record<string, any>
   serializeParams: (
      params: BuiltOptions['params'],
      options: BuiltOptions,
      defaultSerializer: DefaultOptions['serializeParams'],
   ) => string
   method?:
      | 'GET'
      | 'POST'
      | 'PUT'
      | 'DELETE'
      | 'PATCH'
      | 'CONNECT'
      | 'OPTIONS'
      | 'TRACE'
      | 'HEAD'
   headers?: Record<string, string>
   rawBody?: FetcherOptions['body']
   readonly body?: BodyInit | null
   serializeBody: (
      body: JsonifiableObject | JsonifiableArray,
      options: BuiltOptions,
      defaultSerializer: DefaultOptions['serializeBody'],
   ) => string
}

export type DefaultOptions = {
   parseResponse: ParseResponse<any>
   parseResponseError: ParseResponseError<any>
   serializeParams: BuiltOptions['serializeParams']
   serializeBody: BuiltOptions['serializeBody']
}

export type UpOptions<TUpData = any, TUpError = any> = Init & {
   parseResponse?: ParseResponse<TUpData>
   parseResponseError?: ParseResponseError<TUpError>
   baseUrl?: BuiltOptions['baseUrl']
   params?: BuiltOptions['params']
   serializeParams?: BuiltOptions['serializeParams']
   method?: BuiltOptions['method']
   headers?: FetcherOptions['headers']
   serializeBody?: BuiltOptions['serializeBody']
}

export type FetcherOptions<TFetcherData = any, TFetcherError = any> = Init & {
   parseResponse?: ParseResponse<TFetcherData>
   parseResponseError?: ParseResponseError<TFetcherError>
   baseUrl?: BuiltOptions['baseUrl']
   params?: BuiltOptions['params']
   serializeParams?: BuiltOptions['serializeParams']
   method?: BuiltOptions['method']
   headers?: HeadersInit & Record<string, string | number | null | undefined>
   body?: BodyInit | JsonifiableObject | JsonifiableArray | null
   serializeBody?: BuiltOptions['serializeBody']
}
