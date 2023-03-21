import { DefaultOptions, RequestOptions } from './createFetcher.js'
import { ResponseError } from './ResponseError.js'

export const specificDefaultOptionsKeys = ['onError', 'onSuccess', 'onFetchStart'] as const

export const specificRequestOptionsKeys = ['body', 'url', 'params'] as const

const parseResponse = (res: Response) =>
   res
      .clone()
      .json()
      .catch(() => res.text())

export const buildOptions = <DD, D = DD>(
   defaultOptions?: DefaultOptions<DD>,
   requestOptions?: RequestOptions<D>,
) => {
   const mergedOptions = {
      parseSuccess: (res: Response): Promise<D> => parseResponse(res),
      parseError: async (res: Response) => {
         return new ResponseError(
            res,
            // await here to avoid creating a new variable. This saves a few bytes
            await parseResponse(res),
         )
      },
      serializeBody: (body: any) => JSON.stringify(body),
      serializeParams(params?: RequestOptions['params']): string {
         // recursively transforms Dates to ISO string and strips undefined
         const clean = JSON.parse(JSON.stringify(params))
         return withQuestionMark(new URLSearchParams(clean).toString())
      },
      ...omit(defaultOptions, specificRequestOptionsKeys),
      ...omit(requestOptions, specificDefaultOptionsKeys),
      rawHeaders: mergeHeaders(requestOptions?.headers, defaultOptions?.headers),
      rawBody: requestOptions?.body,
      get body(): BodyInit | null | undefined {
         return isJsonificable(this.rawBody) ? this.serializeBody(this.rawBody) : this.rawBody
      },
      get headers(): Headers {
         const _headers = new Headers(this.rawHeaders)
         isJson(this.body) &&
            !this.rawHeaders.has('content-type') &&
            _headers.set('content-type', 'application/json')
         return _headers
      },
      get href(): string {
         const { baseUrl = '', url = '', params = '', serializeParams } = this
         const base = typeof baseUrl === 'string' ? baseUrl : baseUrl.origin + baseUrl.pathname
         // params of type string are already considered serialized
         const serializedParams = withQuestionMark(
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
   }
   return mergedOptions
}

/**
 * Are considered Jsonificable:
 * - plain objects
 * - arrays
 * - instances with a toJSON() method
 *
 * class instances without a toJSON() method will NOT be considered jsonificable
 */
export function isJsonificable(body: RequestOptions['body']): body is object {
   return (
      body?.constructor?.name === 'Object' ||
      Array.isArray(body) ||
      typeof (body as any)?.toJSON === 'function'
   )
}

export function isJson(body: any): boolean {
   if (typeof body !== 'string') return false
   try {
      return JSON.parse(body) !== null
   } catch (e) {
      return false
   }
}

export function mergeHeaders(requestHeaders?: HeadersInit, defaultHeaders?: HeadersInit): Headers {
   const headers = new Headers()
   new Headers(requestHeaders).forEach((value, key) => {
      value !== 'undefined' && headers.set(key, value)
   })
   // add the defaults to the headers
   new Headers(defaultHeaders).forEach((value, key) => {
      !headers.has(key) && value !== 'undefined' && headers.set(key, value)
   })
   return headers
}

// also removes keys when the value is undefined
function omit<O extends Record<string, any>, K extends string>(
   obj: O | undefined,
   keys: readonly K[],
): Omit<O, K> {
   const copy = { ...obj } as O

   Object.entries(copy).forEach(([key, value]) => {
      if (keys.includes(key as K) || typeof value === 'undefined') {
         delete copy[key]
      }
   })
   return copy
}

function withQuestionMark(str: string) {
   return !str ? '' : str.startsWith('?') ? str : `?${str}`
}

function addTrailingSlash(str: string) {
   return !str ? '' : str.endsWith('/') ? str : `${str}/`
}

function stripLeadingSlash(str: string) {
   return !str ? '' : str.startsWith('/') ? str.slice(1) : str
}

function isFullUrl(url: string): boolean {
   return url.startsWith('http://') || url.startsWith('https://')
}
