import { DefaultOptions, FetcherOptions } from './createFetcher.js'
import { ResponseError } from './ResponseError.js'

export let specificDefaultOptionsKeys = ['onError', 'onSuccess', 'onFetchStart'] as const

export let specificFetcherOptionsKeys = ['body', 'url', 'params'] as const

let parseResponse = (res: Response) =>
   res
      .clone()
      .json()
      .catch(() => res.text())

export let buildOptions = <DD, D = DD>(
   defaultOptions?: DefaultOptions<DD>,
   fetcherOptions?: FetcherOptions<D>,
) => ({
   async parseError(res: Response): Promise<ResponseError> {
      return new ResponseError(res, await parseResponse(res), this)
   },
   parseSuccess: (res: Response): Promise<D> => parseResponse(res),
   retryTimes: 0,
   retryDelay: (count: number) => 2000 * 1.5 ** (count - 1),
   retryWhen: (res: Response) => new Set([408, 413, 429, 500, 502, 503, 504]).has(res.status),
   serializeBody: JSON.stringify,
   serializeParams: (params: FetcherOptions['params']): string =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params || ''))).toString(),
   ...omit(defaultOptions as Omit<DefaultOptions<DD>, 'headers'>, specificFetcherOptionsKeys),
   ...omit(
      fetcherOptions as Omit<FetcherOptions<D>, 'body' | 'headers'>,
      specificDefaultOptionsKeys,
   ),
   rawBody: fetcherOptions?.body,
   get body(): BodyInit | null | undefined {
      return isJsonificable(this.rawBody) ? this.serializeBody(this.rawBody) : this.rawBody
   },
   // allow mutations by not using a getter
   headers: (() => {
      let _headers = new Headers(mergeHeaders(fetcherOptions?.headers, defaultOptions?.headers))
      isJsonificable(fetcherOptions?.body) &&
         !_headers.has('content-type') &&
         _headers.set('content-type', 'application/json')
      return _headers
   })(),
   get href(): string {
      let { baseUrl = '', url = '', params = '', serializeParams } = this
      // params of type string are already considered serialized
      let serializedParams = withQuestionMark(
         typeof params === 'object' ? serializeParams(params) : params,
      )
      // If `url` is a full url, override the `baseUrl`, otherwise just concat
      return `${/^https?:\/\//.test(url) ? '' : baseUrl}${url}${serializedParams}`
   },
})

/**
 * Are considered Jsonificable:
 * - plain objects
 * - arrays
 * - instances with a toJSON() method
 *
 * class instances without a toJSON() method are NOT considered jsonificable
 */
export let isJsonificable = (body: FetcherOptions['body']): body is object =>
   body?.constructor?.name === 'Object' ||
   Array.isArray(body) ||
   typeof (body as any)?.toJSON === 'function'

export let mergeHeaders = (fetcherHeaders?: HeadersInit, defaultHeaders?: HeadersInit): Headers => {
   let headers = new Headers()
   let mergeWith = (h?: HeadersInit) => {
      new Headers(h).forEach((value, key) => {
         !headers.has(key) && value !== 'undefined' && headers.set(key, value)
      })
   }
   mergeWith(fetcherHeaders)
   mergeWith(defaultHeaders)
   return headers
}

// omits the specified keys and obj[key]: undefined
let omit = <O extends Record<string, any>, K extends string>(
   obj: O | undefined,
   keys: readonly K[],
): Omit<O, K> => {
   let copy = { ...obj } as O
   for (let key in copy) {
      if (keys.includes(key as any) || typeof copy[key] === 'undefined') {
         delete copy[key]
      }
   }
   return copy
}

let withQuestionMark = (str: string) => {
   return !str ? '' : str.startsWith('?') ? str : `?${str}`
}
