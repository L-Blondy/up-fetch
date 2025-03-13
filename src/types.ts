import type { StandardSchemaV1 } from '@standard-schema/spec'

export type KeyOf<O> = O extends unknown ? keyof O : never

export type DistributiveOmit<
   TObject extends object,
   TKey extends KeyOf<TObject> | (string & {}),
> = TObject extends unknown ? Omit<TObject, TKey> : never

export type MaybePromise<T> = T | Promise<T>

type JsonPrimitive = string | number | boolean | null | undefined

export type JsonifiableObject = Record<PropertyKey, any>

export type JsonifiableArray =
   | Array<JsonPrimitive | JsonifiableObject | JsonifiableArray>
   | ReadonlyArray<JsonPrimitive | JsonifiableObject | JsonifiableArray>

export type BaseFetchFn = (
   input: any,
   options?: any,
   ctx?: any,
) => Promise<Response>

type ParseResponse<TParsedData> = (
   response: Response,
   request: Request,
) => MaybePromise<TParsedData>

type ParseRejected = (response: Response, request: Request) => any

type SerializeBody<TRawBody> = (body: TRawBody) => BodyInit | null | undefined

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

type BaseOptions<TFetch extends BaseFetchFn> = DistributiveOmit<
   NonNullable<Parameters<TFetch>[1]>,
   'body' | 'headers' | 'method'
> & {}

type RetryWhen = (
   context:
      | {
           response: Response
           error: undefined
           request: Request
        }
      | {
           response: undefined
           error: {}
           request: Request
        },
) => MaybePromise<boolean>

type RetryAttempts =
   | number
   | ((context: { request: Request }) => MaybePromise<number>)

type RetryDelay =
   | number
   | ((
        context:
           | {
                attempt: number
                response: Response
                error: undefined
                request: Request
             }
           | {
                attempt: number
                response: undefined
                error: {}
                request: Request
             },
     ) => MaybePromise<number>)

export type RetryOptions = {
   attempts?: RetryAttempts
   when?: RetryWhen
   delay?: RetryDelay
}

type OnRetry = (
   context:
      | {
           attempt: number
           response: undefined
           error: {}
           request: Request
        }
      | {
           attempt: number
           response: Response
           error: undefined
           request: Request
        },
) => MaybePromise<void>

export type FallbackOptions = {
   parseRejected: ParseRejected
   parseResponse: ParseResponse<any>
   reject: (response: Response) => MaybePromise<boolean>
   retry: {
      attempts: RetryAttempts
      when: RetryWhen
      delay: RetryDelay
   }
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
   /** Callback executed when the request fails */
   onError?: (error: any, request: Request) => void
   /** Callback executed before the request is made */
   onRequest?: (request: Request) => void
   /** Callback executed before each retry */
   onRetry?: OnRetry
   /** Callback executed when the request succeeds */
   onSuccess?: (data: any, request: Request) => void
   /** URL parameters to be serialized and appended to the URL */
   params?: Params
   /** Function to parse response errors */
   parseRejected?: ParseRejected
   /** Function to parse the response data */
   parseResponse?: ParseResponse<TDefaultParsedData>
   /** Function to determine if a response should throw an error */
   reject?: (response: Response) => MaybePromise<boolean>
   /** The default retry options. Will be merged with the fetcher options */
   retry?: {
      attempts?: RetryAttempts
      when?: RetryWhen
      delay?: RetryDelay
   }
   /** Function to serialize request body. Restrict the valid `body` type by typing its first argument. */
   serializeBody?: SerializeBody<TDefaultRawBody>
   /** Function to serialize URL parameters */
   serializeParams?: SerializeParams
   /** AbortSignal to cancel the request */
   signal?: AbortSignal
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
   /** Callback executed when the request fails */
   onError?: (error: any, request: Request) => void
   /** Callback executed before the request is made */
   onRequest?: (request: Request) => void
   /** Callback executed before each retry */
   onRetry?: OnRetry
   /** Callback executed when the request succeeds */
   onSuccess?: (data: any, request: Request) => void
   /** URL parameters */
   params?: Params
   /** Function to parse response errors */
   parseRejected?: ParseRejected
   /** Function to parse the response data */
   parseResponse?: ParseResponse<TParsedData>
   /** Function to determine if a response should throw an error */
   reject?: (response: Response) => MaybePromise<boolean>
   /** The fetch retry options. Merged with the default retry options */
   retry?: {
      attempts?: RetryAttempts
      when?: RetryWhen
      delay?: RetryDelay
   }
   /** JSON Schema for request/response validation */
   schema?: TSchema
   /** Function to serialize request body. Restrict the valid `body` type by typing its first argument. */
   serializeBody?: SerializeBody<TRawBody>
   /** Function to serialize URL parameters */
   serializeParams?: SerializeParams
   /** AbortSignal to cancel the request */
   signal?: AbortSignal
   /** Request timeout in milliseconds */
   timeout?: number
}
