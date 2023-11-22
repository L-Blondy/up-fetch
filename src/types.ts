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
   options: ComputedOptions,
   defaultParser: (res: Response) => Promise<any>,
) => Promise<TData>

export type ParseResponseError<TError = any> = (
   res: Response,
   options: ComputedOptions,
   defaultParser: (
      res: Response,
      options: ComputedOptions,
   ) => Promise<ResponseError>,
) => Promise<TError>

export type ParseUnknownError<TError = any> = (
   error: any,
   options: ComputedOptions,
) => TError

export type ComputedOptions<
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
      params: ComputedOptions['params'],
      defaultSerializer: (params: ComputedOptions['params']) => string,
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
   rawBody?: UpFetchOptions['body']
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
   serializeParams: ComputedOptions['serializeParams']
   serializeBody: ComputedOptions['serializeBody']
}

export type UpOptions<
   TUpData = any,
   TUpResponseError = any,
   TUpUnknownError = any,
> = Init & {
   baseUrl?: ComputedOptions['baseUrl']
   onBeforeFetch?: (options: ComputedOptions) => void
   headers?: UpFetchOptions['headers']
   method?: ComputedOptions['method']
   onError?: (error: any, options: ComputedOptions) => void
   onResponseError?: (error: any, options: ComputedOptions) => void
   onSuccess?: (data: any, options: ComputedOptions) => void
   onUnknownError?: (error: any, options: ComputedOptions) => void
   params?: ComputedOptions['params']
   parseResponse?: ParseResponse<TUpData>
   parseResponseError?: ParseResponseError<TUpResponseError>
   parseUnknownError?: ParseUnknownError<TUpUnknownError>
   serializeBody?: ComputedOptions['serializeBody']
   serializeParams?: ComputedOptions['serializeParams']
}

export type UpFetchOptions<
   TFetchData = any,
   TFetchResponseError = any,
   TFetchUnknownError = any,
> = Init & {
   baseUrl?: ComputedOptions['baseUrl']
   onBeforeFetch?: (
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   body?: BodyInit | JsonifiableObject | JsonifiableArray | null
   headers?: HeadersInit | Record<string, string | number | null | undefined>
   method?: ComputedOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >['method']
   onError?: (
      error: TFetchResponseError | TFetchUnknownError,
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   onResponseError?: (
      error: TFetchResponseError,
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   onSuccess?: (
      data: TFetchData,
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   onUnknownError?: (
      error: TFetchUnknownError,
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError
      >,
   ) => void
   params?: ComputedOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >['params']
   parseResponse?: ParseResponse<TFetchData>
   parseResponseError?: ParseResponseError<TFetchResponseError>
   parseUnknownError?: ParseUnknownError<TFetchUnknownError>
   serializeBody?: ComputedOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >['serializeBody']
   serializeParams?: ComputedOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError
   >['serializeParams']
}
