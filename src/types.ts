import type { StandardSchemaV1 } from '@standard-schema/spec'

export type KeyOf<O> = O extends unknown ? keyof O : never

export type DistributiveOmit<
   TObject extends object,
   TKey extends KeyOf<TObject> | (string & {}),
> = TObject extends unknown ? Omit<TObject, TKey> : never

type IsNull<T> = [T] extends [null] ? true : false

type IsUnknown<T> = unknown extends T // `T` can be `unknown` or `any`
   ? IsNull<T> extends false // `any` can be `null`, but `unknown` can't be
      ? true
      : false
   : false

export type MaybePromise<T> = T | Promise<T>

type JsonPrimitive = string | number | boolean | null | undefined

export type JsonifiableObject = Record<PropertyKey, any>

export type JsonifiableArray =
   | Array<JsonPrimitive | JsonifiableObject | Array<any> | ReadonlyArray<any>>
   | ReadonlyArray<JsonPrimitive | JsonifiableObject | JsonifiableArray>

export type MinFetchFn = (
   input: Request,
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

export type HeadersObject = Record<string, string | number | null | undefined>

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

type BaseOptions<TFetch extends MinFetchFn> = DistributiveOmit<
   NonNullable<Parameters<TFetch>[1]>,
   'body' | 'headers' | 'method'
> & {}

type RetryContext = {
   response: Response | undefined
   error: unknown
   request: Request
}

type RetryWhen = (context: RetryContext) => MaybePromise<boolean>

type RetryAttempts =
   | number
   | ((context: { request: Request }) => MaybePromise<number>)

type RetryDelay =
   | number
   | ((context: RetryContext & { attempt: number }) => MaybePromise<number>)

export type RetryOptions = {
   /**
    * The number of attempts to make before giving up
    */
   attempts?: RetryAttempts
   /**
    * The delay before retrying
    */
   delay?: RetryDelay
   /**
    * Function to determine if a retry attempt should be made
    */
   when?: RetryWhen
}

export type StreamingEvent = {
   /** The last streamed chunk */
   chunk: Uint8Array
   /** Total bytes, read from the response header "Content-Length" */
   totalBytes: number
   /** Transferred bytes  */
   transferredBytes: number
}

export type DefaultRawBody = BodyInit | JsonifiableObject | JsonifiableArray

export type FallbackOptions = {
   parseRejected: ParseRejected
   parseResponse: ParseResponse<any>
   reject: (response: Response) => MaybePromise<boolean>
   retry: Required<RetryOptions>
   serializeParams: SerializeParams
   serializeBody: SerializeBody<DefaultRawBody>
}

export type GetDefaultParsedData<TDefaultOptions> =
   TDefaultOptions extends DefaultOptions<MinFetchFn, infer U, any> ? U : never

export type GetDefaultRawBody<TDefaultOptions> =
   TDefaultOptions extends DefaultOptions<MinFetchFn, any, infer U>
      ? IsUnknown<U> extends true
         ? DefaultRawBody
         : U
      : never

/**
 * Default configuration options for the fetch client
 */
export type DefaultOptions<
   TFetchFn extends MinFetchFn,
   TDefaultParsedData,
   TDefaultRawBody,
> = BaseOptions<TFetchFn> & {
   /** Base URL to prepend to all request URLs */
   baseUrl?: string
   /** Request headers to be sent with each request */
   headers?: HeadersInit | HeadersObject
   /** HTTP method to use for the request */
   method?: Method
   /** Callback executed when the request fails */
   onError?: (error: unknown, request: Request) => void
   /** Callback executed before the request is made */
   onRequest?: (request: Request) => MaybePromise<void>
   /** Callback executed before each retry */
   onRetry?: (context: RetryContext & { attempt: number }) => void
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
   retry?: RetryOptions
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
   TFetchFn extends MinFetchFn,
   TSchema extends StandardSchemaV1,
   TParsedData,
   TRawBody,
> = BaseOptions<TFetchFn> & {
   /** Base URL to prepend to the request URL */
   baseUrl?: string
   /** Request body data */
   body?: NoInfer<TRawBody> | null | undefined
   /** Request headers */
   headers?: HeadersInit | HeadersObject
   /** HTTP method */
   method?: Method
   /** Callback executed when the request fails */
   onError?: (error: unknown, request: Request) => void
   /** Callback executed before the request is made */
   onRequest?: (request: Request) => MaybePromise<void>
   /** Callback executed each time a chunk of the request stream is sent */
   onRequestStreaming?: (
      event: StreamingEvent,
      request: Request,
   ) => MaybePromise<void>
   /** Callback executed each time a chunk of the response stream is received */
   onResponseStreaming?: (
      event: StreamingEvent,
      response: Response,
   ) => MaybePromise<void>
   /** Callback executed before each retry */
   onRetry?: (context: RetryContext & { attempt: number }) => void
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
   retry?: RetryOptions
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

export type UpFetch<
   TFetchFn extends MinFetchFn = typeof fetch,
   TDefaultOptions extends DefaultOptions<
      MinFetchFn,
      any,
      any
   > = DefaultOptions<MinFetchFn, any, any>,
> = <
   TParsedData = GetDefaultParsedData<TDefaultOptions>,
   TSchema extends StandardSchemaV1<
      TParsedData,
      any
   > = StandardSchemaV1<TParsedData>,
   TRawBody = GetDefaultRawBody<TDefaultOptions>,
>(
   input: Parameters<TFetchFn>[0],
   options?: FetcherOptions<TFetchFn, TSchema, TParsedData, TRawBody>,
   ctx?: Parameters<TFetchFn>[2],
) => Promise<StandardSchemaV1.InferOutput<TSchema>>
