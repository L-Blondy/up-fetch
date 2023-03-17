import { DefaultOptions, RequestOptions } from './createFetcher'
import { FallbackOptions, fallbackOptions } from './fallbackOptions'

export const specificDefaultOptionsKeys = ['onError', 'onSuccess', 'onFetchStart'] as const

export const specificRequestOptionsKeys = ['body', 'url', 'params'] as const

export type Options = Omit<FallbackOptions, 'headers' | 'body'> &
   Omit<DefaultOptions, keyof FallbackOptions | 'headers' | 'body'> &
   Omit<RequestOptions, keyof FallbackOptions | 'headers' | 'body'> & {
      headers: Headers
      body?: BodyInit | null
   }

export const buildOptions = (
   defaultOptions?: DefaultOptions,
   requestOptions?: RequestOptions,
): Options => {
   const options = Object.assign(
      {},
      fallbackOptions,
      omit(defaultOptions, specificRequestOptionsKeys),
      omit(requestOptions, specificDefaultOptionsKeys),
      {
         headers: mergeHeaders(requestOptions?.headers, defaultOptions?.headers),
      },
   )

   const body: BodyInit | null | undefined = isJsonificable(options.body)
      ? options.serializeBody(options.body)
      : options.body

   isJson(body) &&
      !options.headers.has('content-type') &&
      options.headers.set('content-type', 'application/json')

   return {
      ...options,
      body,
   }
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
