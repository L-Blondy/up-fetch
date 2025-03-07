import { ResponseError } from './response-error'
import type { FallbackOptions } from './types'
import { isJsonifiable } from './utils'

export const fallbackOptions: FallbackOptions = {
   parseResponse: (res) =>
      res
         .clone()
         .json()
         .catch(() => res.text())
         .then((data) => data || null),

   parseRejected: async (res, request) =>
      new ResponseError(
         res,
         await fallbackOptions.parseResponse(res, request),
         request,
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
