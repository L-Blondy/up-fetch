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

type Method =
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

export type BaseOptions<TFetch extends typeof fetch> = Omit<
   NonNullable<Parameters<TFetch>[1]>,
   'body' | 'headers' | 'method'
>

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
   TFetchFn extends typeof fetch = typeof fetch,
> = BaseOptions<TFetchFn> & {
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
   method?: Method
   headers: Record<string, string>
   rawBody?: UpFetchOptions['body']
   readonly body?: BodyInit | null
   serializeBody: (
      body: JsonifiableObject | JsonifiableArray,
      defaultSerializer: (body: JsonifiableObject | JsonifiableArray) => string,
   ) => string
}

export type UpOptions<TFetchFn extends typeof fetch = typeof fetch> =
   BaseOptions<TFetchFn> & {
      baseUrl?: string
      onBeforeFetch?: (options: ComputedOptions) => void
      headers?: UpFetchOptions['headers']
      method?: Method
      onError?: (error: any, options: ComputedOptions) => void
      onResponseError?: (error: any, options: ComputedOptions) => void
      onSuccess?: (data: any, options: ComputedOptions) => void
      onUnknownError?: (error: any, options: ComputedOptions) => void
      params?: ComputedOptions['params']
      parseResponse?: ParseResponse<any>
      parseResponseError?: ParseResponseError<any>
      parseUnknownError?: ParseUnknownError<any>
      serializeBody?: ComputedOptions['serializeBody']
      serializeParams?: ComputedOptions['serializeParams']
   }

export type UpFetchOptions<
   TData = any,
   TResponseError = any,
   TUnknownError = any,
   TFetchFn extends typeof fetch = typeof fetch,
> = BaseOptions<TFetchFn> & {
   baseUrl?: string
   onBeforeFetch?: (
      options: ComputedOptions<TData, TResponseError, TUnknownError, TFetchFn>,
   ) => void
   body?: BodyInit | JsonifiableObject | JsonifiableArray | null
   headers?: HeadersInit | Record<string, string | number | null | undefined>
   method?: Method
   onError?: (
      error: TResponseError | TUnknownError,
      options: ComputedOptions<TData, TResponseError, TUnknownError, TFetchFn>,
   ) => void
   onResponseError?: (
      error: TResponseError,
      options: ComputedOptions<TData, TResponseError, TUnknownError, TFetchFn>,
   ) => void
   onSuccess?: (
      data: TData,
      options: ComputedOptions<TData, TResponseError, TUnknownError, TFetchFn>,
   ) => void
   onUnknownError?: (
      error: TUnknownError,
      options: ComputedOptions<TData, TResponseError, TUnknownError, TFetchFn>,
   ) => void
   params?: ComputedOptions<
      TData,
      TResponseError,
      TUnknownError,
      TFetchFn
   >['params']
   parseResponse?: ParseResponse<TData>
   parseResponseError?: ParseResponseError<TResponseError>
   parseUnknownError?: ParseUnknownError<TUnknownError>
   serializeBody?: ComputedOptions<
      TData,
      TResponseError,
      TUnknownError,
      TFetchFn
   >['serializeBody']
   serializeParams?: ComputedOptions<
      TData,
      TResponseError,
      TUnknownError,
      TFetchFn
   >['serializeParams']
}
