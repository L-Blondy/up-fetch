import type { StandardSchemaV1 } from '@standard-schema/spec'
import type {
   Params,
   RawHeaders,
   JsonifiableObject,
   JsonifiableArray,
} from './types'

export let mergeHeaders = (...headerInits: (RawHeaders | undefined)[]) => {
   let res: Record<string, string> = {}
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

export let mergeSignal = (
   signal: AbortSignal | undefined,
   timeout: number | undefined,
): AbortSignal | undefined =>
   // if AbortSignal.any is not supported
   //  AbortSignal.timeout is not supported either
   'any' in AbortSignal
      ? AbortSignal.any(
           [signal, timeout && AbortSignal.timeout(timeout)].filter(
              Boolean,
           ) as AbortSignal[],
        )
      : signal

export let resolveParams = (
   defaultParams: Params | undefined,
   input: unknown,
   fetcherParams: Params | undefined,
): Params =>
   typeof input !== 'string'
      ? {} // an input of type Request cannot use the "params" option
      : stripUndefined({
           // Removing the 'url.searchParams.keys()' from the defaultParams
           // but not from the 'fetcherParams'. The user is responsible for not
           // specifying the params in both the "input" and the fetcher "params" option.
           ...omit(defaultParams, [
              ...new URL(input, 'http://a').searchParams.keys(),
           ]),
           ...fetcherParams,
        })

type KeyOf<O> = O extends unknown ? keyof O : never

export type DistributiveOmit<
   TObject extends object,
   TKey extends KeyOf<TObject> | (string & {}),
> = TObject extends unknown ? Omit<TObject, TKey> : never

export type MaybePromise<T> = T | Promise<T>

export let omit = <O extends object, K extends KeyOf<O> | (string & {})>(
   obj?: O,
   keys: K[] | readonly K[] = [],
): DistributiveOmit<O, K> => {
   let copy = { ...obj } as DistributiveOmit<O, K>
   for (let key in copy) {
      if (keys.includes(key as any as K)) delete copy[key]
   }
   return copy
}

export let stripUndefined = <O extends object>(obj?: O): O => {
   let copy = { ...obj } as O
   for (let key in copy) {
      if (copy[key] === undefined) delete copy[key]
   }
   return copy
}

export let isJsonifiableObjectOrArray = (
   body: any,
): body is JsonifiableObject | JsonifiableArray => {
   if (!body || typeof body !== 'object') return false
   return (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      body?.constructor?.name === 'Object' ||
      Array.isArray(body) ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      typeof body?.toJSON === 'function'
   )
}

export let emptyOptions: any = {}

export function getUrl(
   base: string | undefined = '',
   input: unknown,
   queryString: string,
): any {
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

export async function parseStandardSchema<TSchema extends StandardSchemaV1>(
   schema: TSchema,
   input: StandardSchemaV1.InferInput<TSchema>,
): Promise<StandardSchemaV1.InferOutput<TSchema>> {
   let result = await schema['~standard'].validate(input)
   // if the `issues` field exists, the validation failed
   if (result.issues) {
      throw new Error(JSON.stringify(result.issues, null, 2))
   }
   return result.value
}
