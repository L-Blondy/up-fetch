import { FetcherOptions, JsonifiableObject, JsonifiableArray } from './types.js'

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

export let strip = <O extends Record<string, any>, K extends string>(
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
