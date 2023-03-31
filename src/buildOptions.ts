import { DefaultOptions, FetcherOptions } from './createFetcher.js'
import { ResponseError } from './ResponseError.js'

export let specificDefaultOptionsKeys = ['onError', 'onSuccess', 'onFetchStart'] as const

export let specificFetcherOptionsKeys = ['body', 'url', 'params'] as const

let parseResponse = (res: Response) =>
   res
      .clone()
      .json()
      .catch(() => res.text())

export const buildOptions = <DD, D = DD>(
   defaultOptions?: DefaultOptions<DD>,
   fetcherOptions?: FetcherOptions<D>,
) => ({
   async parseError(res: Response): Promise<ResponseError> {
      return new ResponseError(
         res,
         // await here to avoid creating a new variable. This saves a few bytes
         await parseResponse(res),
         this,
      )
   },
   parseSuccess: (res: Response): Promise<D> => parseResponse(res),
   retryTimes: 0,
   // prettier-ignore
   retryDelay: (count: number) => 2000 * (1.5 ** (count - 1)),
   retryWhen: (res: Response) => new Set([408, 413, 429, 500, 502, 503, 504]).has(res.status),
   serializeBody: JSON.stringify,
   serializeParams(params?: FetcherOptions['params']): string {
      // recursively transforms Dates to ISO string and strips undefined
      let clean = JSON.parse(JSON.stringify(params))
      return withQuestionMark(new URLSearchParams(clean).toString())
   },
   ...omit(defaultOptions as Omit<DefaultOptions<DD>, 'headers'>, specificFetcherOptionsKeys),
   ...omit(
      fetcherOptions as Omit<FetcherOptions<D>, 'body' | 'headers'>,
      specificDefaultOptionsKeys,
   ),
   rawHeaders: mergeHeaders(fetcherOptions?.headers, defaultOptions?.headers),
   rawBody: fetcherOptions?.body,
   get body(): BodyInit | null | undefined {
      return isJsonificable(this.rawBody) ? this.serializeBody(this.rawBody) : this.rawBody
   },
   get headers(): Headers {
      let _headers = new Headers(this.rawHeaders)
      isJson(this.body) &&
         !this.rawHeaders.has('content-type') &&
         _headers.set('content-type', 'application/json')
      return _headers
   },
   get href(): string {
      let { baseUrl = '', url = '', params = '', serializeParams } = this
      let base = typeof baseUrl === 'string' ? baseUrl : baseUrl.origin + baseUrl.pathname
      // params of type string are already considered serialized
      let serializedParams = withQuestionMark(
         typeof params === 'string'
            ? params
            : typeof params === 'object' && params
            ? serializeParams(params)
            : '',
      )
      if (base && url && !isFullUrl(url)) {
         return `${addTrailingSlash(base)}${stripLeadingSlash(url)}${serializedParams}`
      }
      if (base && !url) {
         return `${base}${serializedParams}`
      }

      return `${url}${serializedParams}`
   },
})

/**
 * Are considered Jsonificable:
 * - plain objects
 * - arrays
 * - instances with a toJSON() method
 *
 * class instances without a toJSON() method will NOT be considered jsonificable
 */
export let isJsonificable = (body: FetcherOptions['body']): body is object =>
   body?.constructor?.name === 'Object' ||
   Array.isArray(body) ||
   typeof (body as any)?.toJSON === 'function'

export let isJson = (body: any): boolean => {
   if (typeof body !== 'string') return false
   try {
      return JSON.parse(body) !== null
   } catch (e) {
      return false
   }
}

export let mergeHeaders = (fetcherHeaders?: HeadersInit, defaultHeaders?: HeadersInit): Headers => {
   let headers = new Headers()
   new Headers(fetcherHeaders).forEach((value, key) => {
      value !== 'undefined' && headers.set(key, value)
   })
   // add the defaults to the headers
   new Headers(defaultHeaders).forEach((value, key) => {
      !headers.has(key) && value !== 'undefined' && headers.set(key, value)
   })
   return headers
}

// also removes keys when the value is undefined
let omit = <O extends Record<string, any>, K extends string>(
   obj: O | undefined,
   keys: readonly K[],
): Omit<O, K> => {
   let copy = { ...obj } as O

   Object.entries(copy).forEach(([key, value]) => {
      if (keys.includes(key as K) || typeof value === 'undefined') {
         delete copy[key]
      }
   })
   return copy
}

let withQuestionMark = (str: string) => {
   return !str ? '' : str.startsWith('?') ? str : `?${str}`
}

let addTrailingSlash = (str: string) => {
   return !str ? '' : str.endsWith('/') ? str : `${str}/`
}

let stripLeadingSlash = (str: string) => {
   return !str ? '' : str.startsWith('/') ? str.slice(1) : str
}

let isFullUrl = (url: string): boolean => {
   return url.startsWith('http://') || url.startsWith('https://')
}
