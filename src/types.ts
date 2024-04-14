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

export type BaseOptions<TFetch extends typeof fetch> = DistributiveOmit<
   NonNullable<Parameters<TFetch>[1]>,
   'body' | 'headers' | 'method'
> & {
   baseUrl?: string
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
}

export type ParseResponse<TData> = (
   response: Response,
   options: ComputedOptions,
) => Promise<TData>

export type ParseResponseError<TError = any> = (
   res: Response,
   options: ComputedOptions,
) => Promise<TError>

export type ParseRequestError<TError = any> = (
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
   TResponseError = any,
   TRequestError = any,
   TFetchFn extends typeof fetch = typeof fetch,
> = BaseOptions<TFetchFn> & {
   readonly body?: BodyInit | null
   headers: Record<string, string>
   readonly input: Request | string
   params: Params
   parseResponse: ParseResponse<TData>
   parseResponseError: ParseResponseError<TResponseError>
   parseRequestError: ParseRequestError<TRequestError>
   rawBody?: RawBody
   serializeBody: SerializeBody
   serializeParams: SerializeParams
}

export type UpOptions<
   TFetchFn extends typeof fetch = typeof fetch,
   TResponseError = any,
   TRequestError = any,
> = BaseOptions<TFetchFn> & {
   headers?: RawHeaders
   onBeforeFetch?: (options: ComputedOptions) => void
   onError?: (error: any, options: ComputedOptions) => void
   onResponseError?: (error: any, options: ComputedOptions) => void
   onSuccess?: (data: any, options: ComputedOptions) => void
   onRequestError?: (error: any, options: ComputedOptions) => void
   params?: Params
   parseResponse?: ParseResponse<any>
   parseResponseError?: ParseResponseError<TResponseError>
   parseRequestError?: ParseRequestError<TRequestError>
   serializeBody?: SerializeBody
   serializeParams?: SerializeParams
}

export type UpFetchOptions<
   TData = any,
   TResponseError = any,
   TRequestError = any,
   TFetchFn extends typeof fetch = typeof fetch,
> = BaseOptions<TFetchFn> & {
   body?: RawBody
   headers?: RawHeaders
   onBeforeFetch?: (
      options: ComputedOptions<TData, TResponseError, TRequestError, TFetchFn>,
   ) => void
   onError?: (
      error: any,
      options: ComputedOptions<TData, TResponseError, TRequestError, TFetchFn>,
   ) => void
   onResponseError?: (
      error: TResponseError,
      options: ComputedOptions<TData, TResponseError, TRequestError, TFetchFn>,
   ) => void
   onSuccess?: (
      data: TData,
      options: ComputedOptions<TData, TResponseError, TRequestError, TFetchFn>,
   ) => void
   onRequestError?: (
      error: TRequestError,
      options: ComputedOptions<TData, TResponseError, TRequestError, TFetchFn>,
   ) => void
   params?: Params
   parseResponse?: ParseResponse<TData>
   parseResponseError?: ParseResponseError<TResponseError>
   parseRequestError?: ParseRequestError<TRequestError>
   serializeBody?: SerializeBody
   serializeParams?: SerializeParams
}
