import { FetcherOptions } from './types'

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

export let isJsonificable = (body: FetcherOptions['body']): body is object => {
   if (!body || (body as any).buffer || typeof body !== 'object') return false
   return (
      body?.constructor?.name === 'Object' ||
      Array.isArray(body) ||
      typeof (body as any)?.toJSON === 'function'
   )
}

export let withQuestionMark = (str?: string) =>
   !str ? '' : str.startsWith('?') ? str : `?${str}`

export let searchToObject = (search: string): Record<string, string> => {
   let params = new URLSearchParams(search)
   let obj: Record<string, string> = {}
   for (let [key, val] of params.entries()) {
      obj[key] = val
   }
   return obj
}

export let getUrlFromInput = (
   input: RequestInfo | URL,
   baseUrl?: string,
): URL => {
   if (typeof input === 'string') {
      return new URL(input, baseUrl)
   }
   if (input instanceof Request) {
      return new URL(input.url)
   }
   return input
}
