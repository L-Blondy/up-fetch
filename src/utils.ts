import {
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

export let computeParams = (
   defaultParams: Params | undefined,
   input: unknown,
   fetcherParams: Params | undefined,
): Params =>
   typeof input !== 'string'
      ? {} // an input of type Request cannot use the "params" option
      : strip({
           // Removing the 'url.searchParams.keys()' from the defaultParams
           // but not from the 'fetcherParams'. The user is responsible for not
           // specifying the params in both the "input" and the fetcher "params" option.
           ...strip(defaultParams, [
              ...new URL(input, 'http://a').searchParams.keys(),
           ]),
           ...fetcherParams,
        })

type KeysOfUnion<ObjectType> = ObjectType extends unknown
   ? keyof ObjectType
   : never

export type DistributiveOmit<
   TObject extends object,
   TKey extends KeysOfUnion<TObject> | (string & {}),
> = TObject extends unknown ? Omit<TObject, TKey> : never

export type MaybePromise<T> = T | Promise<T>

export let strip = <O extends object, K extends KeysOfUnion<O> | (string & {})>(
   obj?: O,
   keys: K[] | readonly K[] = [],
): DistributiveOmit<O, K> => {
   let copy = { ...obj } as DistributiveOmit<O, K>
   for (let key in copy) {
      if (keys.includes(key as any) || copy[key] === undefined) delete copy[key]
   }
   return copy
}

export let isJsonifiableObjectOrArray = (
   body: any,
): body is JsonifiableObject | JsonifiableArray => {
   if (!body || typeof body !== 'object') return false
   return (
      body?.constructor?.name === 'Object' ||
      Array.isArray(body) ||
      typeof (body as any)?.toJSON === 'function'
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
