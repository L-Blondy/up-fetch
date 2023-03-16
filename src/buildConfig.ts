import { DefaultConfig, RequestConfig } from './createFetcher'
import { FallbackConfig, fallbackConfig } from './fallbackConfig'

export const specificDefaultConfigKeys = ['onError', 'onSuccess', 'onFetchStart'] as const

export const specificRequestConfigKeys = ['body', 'url', 'params'] as const

export type Config = Omit<FallbackConfig, 'headers' | 'body'> &
   Omit<DefaultConfig, keyof FallbackConfig | 'headers' | 'body'> &
   Omit<RequestConfig, keyof FallbackConfig | 'headers' | 'body'> & {
      headers: Headers
      body?: BodyInit | null
   }

export const buildConfig = (
   defaultConfig?: DefaultConfig,
   requestConfig?: RequestConfig,
): Config => {
   const config = Object.assign(
      {},
      fallbackConfig,
      omit(defaultConfig, specificRequestConfigKeys),
      omit(requestConfig, specificDefaultConfigKeys),
      {
         headers: mergeHeaders(requestConfig?.headers, defaultConfig?.headers),
      },
   )

   const body: BodyInit | null | undefined = isJsonificable(config.body)
      ? config.serializeBody(config.body)
      : config.body

   isJson(body) &&
      !config.headers.has('content-type') &&
      config.headers.set('content-type', 'application/json')

   return {
      ...config,
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
export function isJsonificable(body: RequestConfig['body']): body is object {
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
