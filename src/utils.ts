import type { StandardSchemaV1 } from '@standard-schema/spec'
import type {
   DistributiveOmit,
   JsonifiableArray,
   JsonifiableObject,
   KeyOf,
   Params,
   RawHeaders,
   SerializeParams,
} from './types'
import { ValidationError } from './validation-error'

export const mergeHeaders = (headerInits: (RawHeaders | undefined)[]) => {
   const res: Record<string, string> = {}
   headerInits.forEach((init) => {
      // casting `init` to `HeadersInit` because `Record<string, any>` is
      // properly transformed to `Record<string,string>` by `new Headers(init)`
      new Headers(init as HeadersInit | undefined).forEach((value, key) => {
         if (value === 'null' || value === 'undefined') {
            delete res[key]
         } else {
            res[key] = value
         }
      })
   })
   return res
}

export const withTimeout = (
   signal: AbortSignal | undefined,
   timeout: number | undefined,
): AbortSignal | undefined =>
   // if AbortSignal.any is not supported
   // AbortSignal.timeout is not supported either.
   // Feature detection is fine on AbortSignal.any only
   'any' in AbortSignal
      ? AbortSignal.any(
           [signal, timeout && AbortSignal.timeout(timeout)].filter(
              Boolean,
           ) as AbortSignal[],
        )
      : signal

const omit = <O extends object, K extends KeyOf<O> | (string & {})>(
   obj?: O,
   keys: K[] | readonly K[] = [],
): DistributiveOmit<O, K> => {
   const copy = { ...obj } as DistributiveOmit<O, K>
   for (const key in copy) {
      if (keys.includes(key as any as K)) delete copy[key]
   }
   return copy
}

export const isJsonifiable = (
   value: any,
): value is JsonifiableObject | JsonifiableArray => {
   // bun FormData has a toJSON method
   if (!value || typeof value !== 'object' || value instanceof FormData)
      return false
   return (
      value?.constructor?.name === 'Object' ||
      Array.isArray(value) ||
      typeof value?.toJSON === 'function'
   )
}

export function resolveUrl(
   base: string | undefined = '',
   input: URL | string,
   defaultOptsParams: Params | undefined,
   fetcherOptsParams: Params | undefined,
   serializeParams: SerializeParams,
): string {
   input = (input as URL).href ?? input
   const qs = serializeParams({
      // Removing the 'url.searchParams.keys()' from the defaultParams
      // but not from the 'fetcherParams'. The user is responsible for not
      // specifying the params in both the "input" and the fetcher "params" option.
      ...omit(defaultOptsParams, [
         ...new URL(input, 'http://a').searchParams.keys(),
      ]),
      ...fetcherOptsParams,
   })

   let url: string = /^https?:\/\//.test(input)
      ? input
      : !base || !input
        ? base + input
        : base.replace(/\/$/, '') + '/' + input.replace(/^\//, '')

   if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs.replace(/^\?/, '')
   }
   return url
}

export async function validate<TSchema extends StandardSchemaV1>(
   schema: TSchema,
   data: StandardSchemaV1.InferInput<TSchema>,
): Promise<StandardSchemaV1.InferOutput<TSchema>> {
   const result = await schema['~standard'].validate(data)
   if (result.issues) throw new ValidationError(result, data)
   return result.value
}
