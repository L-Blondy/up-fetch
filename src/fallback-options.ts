import { ResponseError } from './response-error'
import type { FallbackOptions } from './types'
import { isJsonifiable } from './utils'

export let fallbackOptions: FallbackOptions<any> = {
   parseResponse: (res) =>
      res
         .clone()
         .json()
         .catch(() => res.text())
         .then((data) => data || null),

   parseRejected: async (res, options) =>
      new ResponseError(
         res,
         await fallbackOptions.parseResponse(res, options),
         options,
      ),

   // TODO: find a lighter way to do this with about the same amount of code
   serializeParams: (params) =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(
         JSON.parse(JSON.stringify(params)) as Record<string, string>,
      ).toString(),

   serializeBody: (body: any) =>
      isJsonifiable(body) ? JSON.stringify(body) : body,

   reject: (response) => !response.ok,
}
