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

export type UpOptions<
   TUpData = any,
   TUpResponseError = any,
   TUpUnknownError = any,
   TFetchFn extends typeof fetch = typeof fetch,
> = BaseOptions<TFetchFn> & {
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
   TFetchFn extends typeof fetch = typeof fetch,
> = BaseOptions<TFetchFn> & {
   baseUrl?: ComputedOptions['baseUrl']
   onBeforeFetch?: (
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError,
         TFetchFn
      >,
   ) => void
   body?: BodyInit | JsonifiableObject | JsonifiableArray | null
   headers?: HeadersInit | Record<string, string | number | null | undefined>
   method?: ComputedOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError,
      TFetchFn
   >['method']
   onError?: (
      error: TFetchResponseError | TFetchUnknownError,
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError,
         TFetchFn
      >,
   ) => void
   onResponseError?: (
      error: TFetchResponseError,
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError,
         TFetchFn
      >,
   ) => void
   onSuccess?: (
      data: TFetchData,
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError,
         TFetchFn
      >,
   ) => void
   onUnknownError?: (
      error: TFetchUnknownError,
      options: ComputedOptions<
         TFetchData,
         TFetchResponseError,
         TFetchUnknownError,
         TFetchFn
      >,
   ) => void
   params?: ComputedOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError,
      TFetchFn
   >['params']
   parseResponse?: ParseResponse<TFetchData>
   parseResponseError?: ParseResponseError<TFetchResponseError>
   parseUnknownError?: ParseUnknownError<TFetchUnknownError>
   serializeBody?: ComputedOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError,
      TFetchFn
   >['serializeBody']
   serializeParams?: ComputedOptions<
      TFetchData,
      TFetchResponseError,
      TFetchUnknownError,
      TFetchFn
   >['serializeParams']
}
