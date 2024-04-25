import {
   Params, 
   RawHeaders, 
   JsonifiableObject,
   JsonifiableArray,
} from './types'

export let mergeHeaders = (...headerInits: RawHeaders[]) => {
   let res: Record<string, string> = {}
   headerInits.forEach((init) => {
      // casting `init as HeadersInit` because `Record<string any>` is
      // properly transformed to `Record<string,string>` by `new Headers(init)`
      new Headers(init as HeadersInit).forEach((value, key) => {
         if (value === 'null' || value === 'undefined') {
            delete res[key]
         } else {
            res[key] = value
         }
      })
   })
   return res
}

export let buildParams = (
   defaultParams: Params,
   input: URL | Request | string,
   fetcherParams: Params,
) =>
   isRequest(input)
      ? {} // an input of type Request cannot use the "params" option
      : strip({
           // Removing the 'url.searchParams.keys()' from the defaultParams
           // but not from the 'fetcherParams'. The user is responsible for not
           // specifying the params in both the "input" and the fetcher "params" option.
           ...strip(upParams, [
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

export let withPrefix = (prefix: string, str?: string) =>
   !str ? '' : str.startsWith(prefix) ? str : `${prefix}${str}`

// faster than input instanceof Request
export let isRequest = (input: any): input is Request => !!input.url

export let emptyOptions: any = {}
