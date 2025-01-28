import type { DistributiveOmit, MaybePromise } from './utils'

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

type JsonPrimitive = string | number | boolean | null | undefined

type Interceptor =
   | keyof DefaultOptions<any>
   | keyof FetcherOptions<any> extends infer U
   ? U extends `on${infer V}`
      ? `on${V}`
      : never
   : never

type TupleToUnion<U extends string, R extends any[] = []> = {
   [S in U]: Exclude<U, S> extends never
      ? [...R, S]
      : TupleToUnion<Exclude<U, S>, [...R, S]>
}[U]

export type Interceptors = TupleToUnion<Interceptor>

export type BaseFetchFn = (input: any, options?: any, ctx?: any) => Promise<any>

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

export type ParseResponse<TFetchFn extends BaseFetchFn, TParsedData> = (
   response: Response,
   options: ComputedOptions<TFetchFn>,
) => MaybePromise<TParsedData>

export type ParseResponseError<TFetchFn extends BaseFetchFn, TError> = (
   res: Response,
   options: ComputedOptions<TFetchFn>,
) => MaybePromise<TError>

export type SerializeBody = (
   body: Exclude<RawBody, BodyInit | null>,
) => BodyInit | null | undefined

export type Validate<TFetchFn extends BaseFetchFn, TData, TParsedData> = (
   parsedData: TParsedData,
   options: ComputedOptions<TFetchFn>,
) => MaybePromise<TData>

export type SerializeParams = (params: Params) => string

export type Params = Record<string, any>

type RawBody = BodyInit | JsonifiableObject | JsonifiableArray | null

export type RawHeaders =
   | HeadersInit
   | Record<string, string | number | null | undefined>

export type ComputedOptions<
   TFetchFn extends BaseFetchFn,
   TData = any,
   TError = any,
   TParsedData = any,
> = BaseOptions<TFetchFn> & {
   readonly body?: BodyInit | null
   headers: Record<string, string>
   readonly input: Request | string
   params: Params
   parseResponse: ParseResponse<TFetchFn, TParsedData>
   parseResponseError: ParseResponseError<TFetchFn, TError>
   rawBody?: RawBody
   serializeBody: SerializeBody
   serializeParams: SerializeParams
   throwResponseErrorWhen: (response: Response) => MaybePromise<boolean>
   validate?: Validate<TFetchFn, TData, TParsedData>
}

export type DefaultOptions<
   TFetchFn extends BaseFetchFn,
   TError = any,
> = BaseOptions<TFetchFn> & {
   headers?: RawHeaders
   onBeforeFetch?: (options: ComputedOptions<TFetchFn>) => void
   onError?: (error: any, options: ComputedOptions<TFetchFn>) => void
   onSuccess?: (data: any, options: ComputedOptions<TFetchFn>) => void
   params?: Params
   parseResponse?: ParseResponse<TFetchFn, any>
   parseResponseError?: ParseResponseError<TFetchFn, TError>
   serializeBody?: SerializeBody
   serializeParams?: SerializeParams
   throwResponseErrorWhen?: (response: Response) => MaybePromise<boolean>
}

export type FetcherOptions<
   TFetchFn extends BaseFetchFn,
   TData = any,
   TError = any,
   TParsedData = any,
> = BaseOptions<TFetchFn> & {
   body?: RawBody
   headers?: RawHeaders
   params?: Params
   parseResponse?: ParseResponse<TFetchFn, TParsedData>
   parseResponseError?: ParseResponseError<TFetchFn, TError>
   serializeBody?: SerializeBody
   serializeParams?: SerializeParams
   throwResponseErrorWhen?: (response: Response) => MaybePromise<boolean>
   validate?: Validate<TFetchFn, TData, TParsedData>
}
