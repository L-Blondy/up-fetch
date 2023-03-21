import { DefaultOptions, RequestOptions } from './createFetcher.js'

export const specificDefaultOptionsKeys = ['onError', 'onSuccess', 'onFetchStart'] as const

export const specificRequestOptionsKeys = ['body', 'url', 'params'] as const

export const buildOptions = <DD, D = DD>(
   defaultOptions?: DefaultOptions<DD>,
   requestOptions?: RequestOptions<D>,
) => {
   const options = {
      parseResponseOk: async (res: Response): Promise<D> => {
         return await res
            .clone()
            .json()
            .catch(() => res.text())
      },

      ...omit(defaultOptions, specificRequestOptionsKeys),
      ...omit(requestOptions, specificDefaultOptionsKeys),
      rawHeaders: mergeHeaders(requestOptions?.headers, defaultOptions?.headers),
      rawBody: requestOptions?.body,
      get body(): BodyInit | null | undefined {
         const serializeBody =
            this.serializeBody ?? ((body: object | any[]) => JSON.stringify(body))
         return isJsonificable(this.rawBody) ? serializeBody(this.rawBody) : this.rawBody
      },
      get headers(): Headers {
         const _headers = new Headers(this.rawHeaders)
         isJson(this.body) &&
            !this.rawHeaders.has('content-type') &&
            _headers.set('content-type', 'application/json')
         return _headers
      },
      get href(): string {
         const {
            baseUrl = '',
            url = '',
            params = '',
            serializeParams = (params?: typeof this.params): string => {
               // recursively transforms Dates to ISO string and strips undefined
               const clean = JSON.parse(JSON.stringify(params))
               return withQuestionMark(new URLSearchParams(clean).toString())
            },
         } = this
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
   return options
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
      const parsed = JSON.parse(body)
      return parsed !== null && typeof parsed === 'object'
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
   if (!str) return ''
   return str.startsWith('?') ? str : `?${str}`
}

function addTrailingSlash(str: string) {
   if (!str) return ''
   return str.endsWith('/') ? str : `${str}/`
}

function stripLeadingSlash(str: string) {
   if (!str) return ''
   return str.startsWith('/') ? str.slice(1) : str
}

function isFullUrl(url: string): boolean {
   return url.startsWith('http://') || url.startsWith('https://')
}
