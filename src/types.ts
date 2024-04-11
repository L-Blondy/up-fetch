import { DistributiveOmit } from './utils.js'

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

export type BaseOptions<TFetch extends typeof fetch> = DistributiveOmit<
   NonNullable<Parameters<TFetch>[1]>,
   'body' | 'headers' | 'method'
>

export type ParseResponse<TData> = (
   response: Response,
   options: ComputedOptions,
) => Promise<TData>

export type ParseResponseError<TError = any> = (
   res: Response,
   options: ComputedOptions,
) => Promise<TError>

export type ParseUnknownError<TError = any> = (
   error: any,
   options: ComputedOptions,
) => TError

export type SerializeBody = (body: Exclude<RawBody, BodyInit | null>) => string

export type SerializeParams = (params: Params) => string

type Params = Record<string, any>

type RawBody = BodyInit | JsonifiableObject | JsonifiableArray | null

type RawHeaders =
   | HeadersInit
   | Record<string, string | number | null | undefined>

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
   params: Params
   serializeParams: SerializeParams
   method?: Method
   headers: Record<string, string>
   rawBody?: RawBody
   readonly body?: BodyInit | null
   serializeBody: SerializeBody
}

export type UpOptions<TFetchFn extends typeof fetch = typeof fetch> =
   BaseOptions<TFetchFn> & {
      baseUrl?: string
      onBeforeFetch?: (options: ComputedOptions) => void
      headers?: RawHeaders
      method?: Method
      onError?: (error: any, options: ComputedOptions) => void
      onResponseError?: (error: any, options: ComputedOptions) => void
      onSuccess?: (data: any, options: ComputedOptions) => void
      onUnknownError?: (error: any, options: ComputedOptions) => void
      params?: Params
      parseResponse?: ParseResponse<any>
      parseResponseError?: ParseResponseError<any>
      parseUnknownError?: ParseUnknownError<any>
      serializeBody?: SerializeBody
      serializeParams?: SerializeParams
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
   body?: RawBody
   headers?: RawHeaders
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
   params?: Params
   parseResponse?: ParseResponse<TData>
   parseResponseError?: ParseResponseError<TResponseError>
   parseUnknownError?: ParseUnknownError<TUnknownError>
   serializeBody?: SerializeBody
   serializeParams?: SerializeParams
}
