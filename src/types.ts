import { DistributiveOmit, MaybePromise } from './utils'

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

export type BaseFetchFn = (input: unknown, options?: unknown, ctx?: unknown) => Promise<any>

export type BaseOptions<TFetch extends BaseFetchFn> = DistributiveOmit<
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

export type SerializeBody = (
   body: Exclude<RawBody, BodyInit | null>,
) => BodyInit | null | undefined

export type SerializeParams = (params: Params) => string

export type Params = Record<string, any>

type RawBody = BodyInit | JsonifiableObject | JsonifiableArray | null

export type RawHeaders =
   | HeadersInit
   | Record<string, string | number | null | undefined>

export type ComputedOptions<
   TData = any,
   TResponseError = any,
   TFetchFn extends BaseFetchFn = typeof fetch,
> = BaseOptions<TFetchFn> & {
   readonly body?: BodyInit | null
   headers: Record<string, string>
   readonly input: Request | string
   params: Params
   parseResponse: ParseResponse<TData>
   parseResponseError: ParseResponseError<TResponseError>
   rawBody?: RawBody
   serializeBody: SerializeBody
   serializeParams: SerializeParams
   throwResponseErrorWhen: (response: Response) => MaybePromise<boolean>
}

export type DefaultOptions<
   TFetchFn extends BaseFetchFn = typeof fetch,
   TResponseError = any,
> = BaseOptions<TFetchFn> & {
   headers?: RawHeaders
   onBeforeFetch?: (options: ComputedOptions) => void
   onParsingError?: (error: any, options: ComputedOptions) => void
   onResponseError?: (error: any, options: ComputedOptions) => void
   onRequestError?: (error: Error, options: ComputedOptions) => void
   onSuccess?: (data: any, options: ComputedOptions) => void
   params?: Params
   parseResponse?: ParseResponse<any>
   parseResponseError?: ParseResponseError<TResponseError>
   serializeBody?: SerializeBody
   serializeParams?: SerializeParams
   throwResponseErrorWhen?: (response: Response) => MaybePromise<boolean>
}

export type FetcherOptions<
   TData = any,
   TResponseError = any,
   TFetchFn extends BaseFetchFn = typeof fetch,
> = BaseOptions<TFetchFn> & {
   body?: RawBody
   headers?: RawHeaders
   onBeforeFetch?: (
      options: ComputedOptions<TData, TResponseError, TFetchFn>,
   ) => void
   onParsingError?: (error: any, options: ComputedOptions) => void
   onResponseError?: (
      error: TResponseError,
      options: ComputedOptions<TData, TResponseError, TFetchFn>,
   ) => void
   onRequestError?: (
      error: Error,
      options: ComputedOptions<TData, TResponseError, TFetchFn>,
   ) => void
   onSuccess?: (
      data: TData,
      options: ComputedOptions<TData, TResponseError, TFetchFn>,
   ) => void
   params?: Params
   parseResponse?: ParseResponse<TData>
   parseResponseError?: ParseResponseError<TResponseError>
   serializeBody?: SerializeBody
   serializeParams?: SerializeParams
   throwResponseErrorWhen?: (response: Response) => MaybePromise<boolean>
}
