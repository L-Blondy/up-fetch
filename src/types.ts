import { defaultOptions } from './buildOptions'

export type ParseResponse<TData> = (
   response: Response,
   options: BuiltOptions,
) => Promise<TData>

export type ParseResponseError<TError = any> = (
   res: Response,
   options: BuiltOptions,
) => Promise<TError>

type Init = Omit<RequestInit, 'body' | 'headers' | 'method'>

export type BuiltOptions<TData = any, TError = any> = Init & {
   parseResponse: ParseResponse<TData>
   parseResponseError: ParseResponseError<TError>
   href: string
   baseUrl?: string
   params?: Record<string, any>
   serializeParams: (
      params: BuiltOptions['params'],
      options: BuiltOptions,
      defaultSerializer: (typeof defaultOptions)['serializeParams'],
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
   body?: BodyInit
   serializeBody: (
      body: Exclude<FetcherOptions['body'], BodyInit | null | undefined>,
      options: BuiltOptions,
      defaultSerializer: (typeof defaultOptions)['serializeBody'],
   ) => string
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
   body?: BodyInit | Record<string, any> | Array<any> | null
   serializeBody?: BuiltOptions['serializeBody']
}
