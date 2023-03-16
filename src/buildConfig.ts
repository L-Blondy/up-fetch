import { FactoryConfig, RequestConfig } from './createFetcher'
import { DefaultConfig, defaultConfig } from './defaultConfig'

export const specificFactoryConfigKeys = ['onError', 'onSuccess', 'onFetchStart'] as const

export const specificRequestConfigKeys = ['body', 'url', 'params'] as const

export type Config = Omit<DefaultConfig, 'headers' | 'body'> &
   Omit<FactoryConfig, keyof DefaultConfig | 'headers' | 'body'> &
   Omit<RequestConfig, keyof DefaultConfig | 'headers' | 'body'> & {
      headers: Headers
      body?: BodyInit | null
   }

export const buildConfig = (
   factoryConfig?: FactoryConfig,
   requestConfig?: RequestConfig,
): Config => {
   const config = Object.assign(
      {},
      defaultConfig,
      omit(factoryConfig, specificRequestConfigKeys),
      omit(requestConfig, specificFactoryConfigKeys),
      {
         headers: mergeHeaders(requestConfig?.headers, factoryConfig?.headers),
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

export function mergeHeaders(upfetchHeaders?: HeadersInit, factoryHeaders?: HeadersInit): Headers {
   const headers = new Headers()
   new Headers(upfetchHeaders).forEach((value, key) => {
      value !== 'undefined' && headers.set(key, value)
   })
   // add the defaults to the headers
   new Headers(factoryHeaders).forEach((value, key) => {
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
