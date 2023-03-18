import { DefaultOptions, RequestOptions } from './createFetcher'
import { fallbackOptions } from './fallbackOptions'
import { buildUrl } from './buildUrl'

export const specificDefaultOptionsKeys = ['onError', 'onSuccess', 'onFetchStart'] as const

export const specificRequestOptionsKeys = ['body', 'url', 'params'] as const

export const buildOptions = (defaultOptions?: DefaultOptions, requestOptions?: RequestOptions) => {
   const options = {
      ...Object.assign(
         {},
         fallbackOptions,
         omit(defaultOptions, specificRequestOptionsKeys),
         omit(requestOptions, specificDefaultOptionsKeys),
      ),
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
         return buildUrl(this)
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
