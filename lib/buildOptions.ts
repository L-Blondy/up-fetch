import { DefaultOptions, FetcherOptions, RequestOptions } from './createFetcher.js'
import { ResponseError } from './ResponseError.js'

export let specificDefaultOptionsKeys = ['onError', 'onSuccess', 'beforeFetch'] as const

export let specificFetcherOptionsKeys = ['body', 'url'] as const

let parseResponse = (res: Response) =>
   res
      .clone()
      .json()
      .catch(() => res.text())
      .then((data) => data || null)

let retryStatuses = new Set([408, 413, 429, 500, 502, 503, 504])

export let fallbackOptions = {
   parseThrownResponse: async (res: Response, options: RequestOptions): Promise<ResponseError> =>
      new ResponseError(res, await parseResponse(res), options),
   parseResponse: parseResponse,
   retryDelay: (count: number) => 2000 * 1.5 ** (count - 1),
   retryWhen: (res: Response) => retryStatuses.has(res.status),
   serializeBody: JSON.stringify,
   serializeParams: (params: Record<string, any>): string =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params))).toString(),
   throwWhen: (res: Response) => !res.ok,
}

export let buildOptions = <DD, D = DD>(
   defaultOptions?: DefaultOptions<DD>,
   fetcherOptions?: FetcherOptions<D>,
): RequestOptions<DD, D> => {
   let options: RequestOptions<DD, D> = {
      ...fallbackOptions,
      ...strip(defaultOptions, specificFetcherOptionsKeys),
      ...strip(fetcherOptions, specificDefaultOptionsKeys),
      get href() {
         let { baseUrl = '', url = '', params } = options
         let serializedParams = options.serializeParams(
            params,
            options,
            fallbackOptions.serializeParams,
         )
         return `${/^https?:\/\//.test(url) ? '' : baseUrl}${url}${withQuestionMark(
            serializedParams,
         )}`
      },
   } as any

   let isBodyJson = isJsonificable(options.body)

   options.body = isBodyJson
      ? options.serializeBody(options.body as any, options, fallbackOptions.serializeBody)
      : options.body
   options.headers = mergeHeaders(
      isBodyJson ? { 'content-type': 'application/json' } : {},
      defaultOptions?.headers,
      fetcherOptions?.headers,
   )
   options.params = {
      ...strip(defaultOptions?.params),
      ...strip(fetcherOptions?.params),
   }

   return options
}

/**
 * Are considered Jsonificable:
 * - plain objects
 * - arrays
 * - instances with a toJSON() method
 *
 * class instances without a toJSON() method are NOT considered jsonificable
 */
export let isJsonificable = (body: FetcherOptions['body']): body is object =>
   body?.constructor?.name === 'Object' ||
   Array.isArray(body) ||
   typeof (body as any)?.toJSON === 'function'

// export let mergeHeaders = (
//    ...list: (SharedOptions['headers'] | null | false | undefined)[]
// ): Headers => list.reduce(addHeaders, new Headers())

// let addHeaders = (h1: Headers, h2?: SharedOptions['headers'] | null | false) => (
//    h2 &&
//       // null and undefined are automatically stringified to 'undefined' and 'null' by `new Headers()
//       new Headers(h2 as Record<string, string>).forEach(
//          (value, key) => !invalidHeaders.has(value) && h1.set(key, value),
//       ),
//    h1
// )

// let invalidHeaders = new Set(['undefined', 'null', ''])

export let mergeHeaders = (...headerObjects: (Record<string, any> | undefined)[]) => {
   let res: Record<string, any> = {}
   headerObjects.forEach((object) => {
      Object.entries(strip(object)).forEach(([key, value]) => {
         res[key.toLowerCase()] = value
      })
   })
   return new Headers(res)
}

// omits the specified keys and obj[key]: undefined
let strip = <O extends Record<string, any>, K extends string>(
   obj?: O,
   keys: readonly K[] = [],
): Omit<O, K> => {
   let copy = { ...(obj || {}) } as O
   for (let key in copy) {
      if (keys.includes(key as any) || copy[key] === undefined) delete copy[key]
   }
   return copy
}

let withQuestionMark = (str?: string) => (!str ? '' : str.startsWith('?') ? str : `?${str}`)
