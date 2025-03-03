import type { StandardSchemaV1 } from '@standard-schema/spec'
import type {
   JsonifiableArray,
   JsonifiableObject,
   Params,
   RawHeaders,
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

export const mergeSignals = (signals: AbortSignal[]): AbortSignal | undefined =>
   'any' in AbortSignal
      ? AbortSignal.any(signals)
      : signals[0]

export const resolveParams = (
   defaultParams: Params | undefined,
   input: unknown,
   fetcherParams: Params | undefined,
): Params =>
   typeof input !== 'string'
      ? {} // an input of type Request cannot use the "params" option
      : {
           // Removing the 'url.searchParams.keys()' from the defaultParams
           // but not from the 'fetcherParams'. The user is responsible for not
           // specifying the params in both the "input" and the fetcher "params" option.
           ...omit(defaultParams, [
              ...new URL(input, 'http://a').searchParams.keys(),
           ]),
           ...fetcherParams,
        }

type KeyOf<O> = O extends unknown ? keyof O : never

export type DistributiveOmit<
   TObject extends object,
   TKey extends KeyOf<TObject> | (string & {}),
> = TObject extends unknown ? Omit<TObject, TKey> : never

export type MaybePromise<T> = T | Promise<T>

export const omit = <O extends object, K extends KeyOf<O> | (string & {})>(
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

export const emptyOptions: any = {}

export function resolveInput<T>(
   base: string | undefined = '',
   input: T,
   queryString: string,
): T | string {
   if (typeof input !== 'string') return input
   let url = /^https?:\/\//.test(input)
      ? input
      : !base || !input
        ? base + input
        : base.replace(/\/$/, '') + '/' + input.replace(/^\//, '')

   if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString.replace(/^\?/, '')
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
