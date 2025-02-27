import type { DistributiveOmit, MaybePromise } from './utils'
import type { StandardSchemaV1 } from '@standard-schema/spec'

type JsonPrimitive = string | number | boolean | null | undefined

export type JsonifiableObject = Record<PropertyKey, any>

export type JsonifiableArray =
   | Array<JsonPrimitive | JsonifiableObject | JsonifiableArray>
   | ReadonlyArray<JsonPrimitive | JsonifiableObject | JsonifiableArray>

type Interceptor =
   | keyof DefaultOptions<any, any, any>
   | keyof FetcherOptions<any, any, any, any> extends infer U
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

export type ParseRejected<TFetchFn extends BaseFetchFn> = (
   res: Response,
   options: ResolvedOptions<TFetchFn>,
) => any

export type SerializeBody<TRawBody> = (
   body: TRawBody,
) => BodyInit | null | undefined

export type SerializeParams = (params: Params) => string

export type Params = Record<string, any>

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
   TRawBody = any,
> = BaseOptions<TFetchFn> & {
   baseUrl?: string
   readonly body?: BodyInit | null
   headers: Record<string, string>
   readonly input: Request | string
   method?: Method
   params: Params
   parseRejected: ParseRejected<TFetchFn>
   parseResponse: ParseResponse<TFetchFn, TParsedData>
   rawBody?: TRawBody | null | undefined
   reject: (response: Response) => MaybePromise<boolean>
   schema?: TSchema
   serializeBody: SerializeBody<TRawBody>
   serializeParams: SerializeParams
   signal?: AbortSignal
   timeout?: number
}

export type FallbackOptions<TFetchFn extends BaseFetchFn> = {
   parseRejected: ParseRejected<TFetchFn>
   parseResponse: ParseResponse<TFetchFn, any>
   reject: (response: Response) => MaybePromise<boolean>
   serializeParams: SerializeParams
   serializeBody: SerializeBody<BodyInit | JsonifiableObject | JsonifiableArray>
}

/**
 * Default configuration options for the fetch client
 */
export type DefaultOptions<
   TFetchFn extends BaseFetchFn,
   TDefaultParsedData,
   TDefaultRawBody,
> = BaseOptions<TFetchFn> & {
   /** Base URL to prepend to all request URLs */
   baseUrl?: string
   /** Request headers to be sent with each request */
   headers?: RawHeaders
   /** HTTP method to use for the request */
   method?: Method
   /** Callback executed before the request is made */
   onRequest?: (options: ResolvedOptions<TFetchFn>) => void
   /** Callback executed when the request fails */
   onError?: (error: any, options: ResolvedOptions<TFetchFn>) => void
   /** Callback executed when the request succeeds */
   onSuccess?: (data: any, options: ResolvedOptions<TFetchFn>) => void
   /** URL parameters to be serialized and appended to the URL */
   params?: Params
   /** Function to parse response errors */
   parseRejected?: ParseRejected<TFetchFn>
   /** Function to parse the response data */
   parseResponse?: ParseResponse<TFetchFn, TDefaultParsedData>
   /**
    * @deprecated Will be renamed `parseRejected` in v2.0
    */
   parseResponseError?: ParseRejected<TFetchFn>
   /** Function to determine if a response should throw an error */
   reject?: (response: Response) => MaybePromise<boolean>
   /** Function to serialize request body. Restrict the valid `body` type by typing its first argument. */
   serializeBody?: SerializeBody<TDefaultRawBody>
   /** Function to serialize URL parameters */
   serializeParams?: SerializeParams
   /** AbortSignal to cancel the request */
   signal?: AbortSignal
   /**
    * @deprecated Will be renamed `reject` in v2.0
    */
   throwResponseError?: (response: Response) => MaybePromise<boolean>
   /** Request timeout in milliseconds */
   timeout?: number
}

/**
 * Options for individual fetch requests
 */
export type FetcherOptions<
   TFetchFn extends BaseFetchFn,
   TSchema extends StandardSchemaV1,
   TParsedData,
   TRawBody,
> = BaseOptions<TFetchFn> & {
   /** Base URL to prepend to the request URL */
   baseUrl?: string
   /** Request body data */
   body?: NoInfer<TRawBody> | null | undefined
   /** Request headers */
   headers?: RawHeaders
   /** HTTP method */
   method?: Method
   /** URL parameters */
   params?: Params
   /** Function to parse response errors */
   parseRejected?: ParseRejected<TFetchFn>
   /** Function to parse the response data */
   parseResponse?: ParseResponse<TFetchFn, TParsedData>
   /**
    * @deprecated Will be renamed `parseRejected` in v2.0
    */
   parseResponseError?: ParseRejected<TFetchFn>
   /** Function to determine if a response should throw an error */
   reject?: (response: Response) => MaybePromise<boolean>
   /** JSON Schema for request/response validation */
   schema?: TSchema
   /** Function to serialize request body. Restrict the valid `body` type by typing its first argument. */
   serializeBody?: SerializeBody<TRawBody>
   /** Function to serialize URL parameters */
   serializeParams?: SerializeParams
   /** AbortSignal to cancel the request */
   signal?: AbortSignal
   /**
    * @deprecated Will be renamed `reject` in v2.0
    */
   throwResponseError?: (response: Response) => MaybePromise<boolean>
   /** Request timeout in milliseconds */
   timeout?: number
}
