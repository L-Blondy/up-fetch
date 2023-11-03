import {
   FetcherOptions,
   JsonifiableObject,
   JsonifiableArray,
   UpOptions,
} from './types.js'

export let mergeHeaders = (...headerInits: FetcherOptions['headers'][]) => {
   let res: Record<string, string> = {}
   headerInits.forEach((init) => {
      new Headers(init).forEach((value, key) => {
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
   upParams: UpOptions['params'],
   input: URL | Request | string,
   fetcherParams: FetcherOptions['params'],
) =>
   isInputRequest(input)
      ? {} // an input of type Request cannot use the "params" option
      : strip({
           // The 'url.search' should take precedence over 'defaultParams'.
           // It will be retained in the 'input' as it should not undergo unserialization and reserialization.
           // Therefore, I remove the 'url.searchParams.keys()' from the 'up' params.
           // However I don't remove it from the 'fetcherParams'. The user should be careful not to
           // specify the params in both the "input" and the fetcher "params" option.
           ...strip(upParams, [
              ...new URL(input, 'http://a').searchParams.keys(),
           ]),
           ...fetcherParams,
        })

export let strip = <O extends Record<string, any>, K extends keyof O = never>(
   obj?: O,
   keys: readonly K[] = [],
): Omit<O, K> => {
   let copy = { ...obj } as O
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

export let isInputRequest = (input: any): input is Request => {
   return !!input.url
}
