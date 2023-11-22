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
   options: UpFetchOptions,
   defaultParser: (res: Response) => Promise<any>,
) => Promise<TData>

export type ParseResponseError<TError = any> = (
   res: Response,
   options: UpFetchOptions,
   defaultParser: (
      res: Response,
      options: UpFetchOptions,
   ) => Promise<ResponseError>,
) => Promise<TError>

export type ParseUnknownError<TError = any> = (
   error: any,
   options: UpFetchOptions,
) => TError

export type UpFetchOptions<
   TData = any,
   TRespError = any,
   TUnkError = any,
> = Init & {
   readonly input: Request | string
   parseResponse: ParseResponse<TData>
   parseResponseError: ParseResponseError<TRespError>
   parseUnknownError: ParseUnknownError<TUnkError>
   baseUrl?: string
   params: Record<string, any>
   serializeParams: (
      params: UpFetchOptions['params'],
      defaultSerializer: (params: UpFetchOptions['params']) => string,
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
      | (string & {})
   headers: Record<string, string>
   rawBody?: FetchOptions['body']
   readonly body?: BodyInit | null
   serializeBody: (
      body: JsonifiableObject | JsonifiableArray,
      defaultSerializer: (body: JsonifiableObject | JsonifiableArray) => string,
   ) => string
}

export type DefaultOptions = {
   parseResponse: ParseResponse<any>
   parseResponseError: ParseResponseError<any>
   parseUnknownError: ParseUnknownError<any>
   serializeParams: UpFetchOptions['serializeParams']
   serializeBody: UpFetchOptions['serializeBody']
}

export type UpOptions<
   TUpData = any,
   TUpResponseError = any,
   TUpUnknownError = any,
> = Init & {
   baseUrl?: UpFetchOptions['baseUrl']
   onBeforeFetch?: (options: UpFetchOptions) => void
   headers?: FetchOptions['headers']
   method?: UpFetchOptions['method']
   onError?: (error: any, options: UpFetchOptions) => void
   onResponseError?: (error: any, options: UpFetchOptions) => void
   onSuccess?: (data: any, options: UpFetchOptions) => void
   onUnknownError?: (error: any, options: UpFetchOptions) => void
   params?: UpFetchOptions['params']
   parseResponse?: ParseResponse<TUpData>
   parseResponseError?: ParseResponseError<TUpResponseError>
   parseUnknownError?: ParseUnknownError<TUpUnknownError>
   serializeBody?: UpFetchOptions['serializeBody']
   serializeParams?: UpFetchOptions['serializeParams']
}

export type FetchOptions<
   TFetchData = any,
   TFetchResponseError = any,
   TFetchUnknownError = any,
> = Init & {
   baseUrl?: UpFetchOptions['baseUrl']
   onBeforeFetch?: (
      options: UpFetchOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   body?: BodyInit | JsonifiableObject | JsonifiableArray | null
   headers?: HeadersInit | Record<string, string | number | null | undefined>
   method?: UpFetchOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >['method']
   onError?: (
      error: TFetchResponseError | TFetchUnknownError,
      options: UpFetchOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   onResponseError?: (
      error: TFetchResponseError,
      options: UpFetchOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   onSuccess?: (
      data: TFetchData,
      options: UpFetchOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   onUnknownError?: (
      error: TFetchUnknownError,
      options: UpFetchOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   params?: UpFetchOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >['params']
   parseResponse?: ParseResponse<TFetchData>
   parseResponseError?: ParseResponseError<TFetchResponseError>
   parseUnknownError?: ParseUnknownError<TFetchUnknownError>
   serializeBody?: UpFetchOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >['serializeBody']
   serializeParams?: UpFetchOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >['serializeParams']
}
