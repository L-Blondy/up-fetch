import type { DistributiveOmit, MaybePromise } from './utils'
import type { StandardSchemaV1 } from '@standard-schema/spec'

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

export type ParseResponse<TFetchFn extends BaseFetchFn, TParsedData> = (
   response: Response,
   options: ResolvedOptions<TFetchFn>,
) => MaybePromise<TParsedData>

export type ParseResponseError<TFetchFn extends BaseFetchFn> = (
   res: Response,
   options: ResolvedOptions<TFetchFn>,
) => any

export type SerializeBody = (
   body: Exclude<RawBody, BodyInit | null>,
) => BodyInit | null | undefined

export type SerializeParams = (params: Params) => string

export type Params = Record<string, any>

type RawBody = BodyInit | JsonifiableObject | JsonifiableArray | null

export type RawHeaders =
   | HeadersInit
   | Record<string, string | number | null | undefined>

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

export type BaseOptions<TFetch extends BaseFetchFn> = DistributiveOmit<
   NonNullable<Parameters<TFetch>[1]>,
   'body' | 'headers' | 'method'
> & {}

export type ResolvedOptions<
   TFetchFn extends BaseFetchFn,
   TSchema extends StandardSchemaV1 = any,
   TParsedData = any,
> = BaseOptions<TFetchFn> & {
   baseUrl?: string
   readonly body?: BodyInit | null
   headers: Record<string, string>
   readonly input: Request | string
   method?: Method
   params: Params
   parseResponse: ParseResponse<TFetchFn, TParsedData>
   parseResponseError: ParseResponseError<TFetchFn>
   rawBody?: RawBody
   schema?: TSchema
   serializeBody: SerializeBody
   serializeParams: SerializeParams
   signal?: AbortSignal
   throwResponseError: (response: Response) => MaybePromise<boolean>
   timeout?: number
}

export type DefaultOptions<TFetchFn extends BaseFetchFn> =
   BaseOptions<TFetchFn> & {
      baseUrl?: string
      headers?: RawHeaders
      method?: Method
      onRequest?: (options: ResolvedOptions<TFetchFn>) => void
      onError?: (error: any, options: ResolvedOptions<TFetchFn>) => void
      onSuccess?: (data: any, options: ResolvedOptions<TFetchFn>) => void
      params?: Params
      parseResponse?: ParseResponse<TFetchFn, any>
      parseResponseError?: ParseResponseError<TFetchFn>
      serializeBody?: SerializeBody
      serializeParams?: SerializeParams
      signal?: AbortSignal
      throwResponseError?: (response: Response) => MaybePromise<boolean>
      timeout?: number
   }

export type FetcherOptions<
   TFetchFn extends BaseFetchFn,
   TSchema extends StandardSchemaV1 = any,
   TParsedData = any,
> = BaseOptions<TFetchFn> & {
   baseUrl?: string
   body?: RawBody
   headers?: RawHeaders
   method?: Method
   params?: Params
   parseResponse?: ParseResponse<TFetchFn, TParsedData>
   parseResponseError?: ParseResponseError<TFetchFn>
   schema?: TSchema
   serializeBody?: SerializeBody
   serializeParams?: SerializeParams
   signal?: AbortSignal
   throwResponseError?: (response: Response) => MaybePromise<boolean>
   timeout?: number
}
