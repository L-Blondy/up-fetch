import { FactoryConfig, UpfetchConfig } from './upfetchFactory'
import { DefaultConfig, defaultConfig } from './defaultConfig'

export const specificFactoryConfigKeys = ['onError', 'onSuccess'] as const

export const specificUpfetchConfigKeys = ['body', 'url', 'params'] as const

export type Config = Omit<DefaultConfig, 'headers'> & {
   headers: Headers
   body?: BodyInit | null
} & Omit<FactoryConfig, keyof DefaultConfig> &
   Omit<UpfetchConfig, keyof DefaultConfig | 'body'>

export const buildConfig = (
   factoryConfig?: FactoryConfig,
   upfetchConfig?: UpfetchConfig,
): Config => {
   const config: DefaultConfig & FactoryConfig & UpfetchConfig & { headers: Headers } =
      Object.assign(
         {},
         defaultConfig,
         stripUndefined(omit(factoryConfig, specificUpfetchConfigKeys)),
         stripUndefined(omit(upfetchConfig, specificFactoryConfigKeys)),
         {
            headers: mergeHeaders(upfetchConfig?.headers, factoryConfig?.headers),
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
export function isJsonificable(body: UpfetchConfig['body']): body is object {
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

function stripUndefined<O extends Record<string, any>>(obj?: O): O | undefined {
   if (!obj) return obj
   const copy = { ...obj }
   Object.entries(copy).forEach(([key, value]) => {
      if (typeof value === 'undefined') {
         delete copy[key]
      }
   })
   return copy
}

function omit<O extends Record<string, any>, K extends string>(
   obj: O | undefined,
   keys: readonly K[],
): Omit<O, K> | undefined {
   const copy = { ...obj } as O
   for (const key of keys) {
      delete copy[key]
   }
   return copy
}
