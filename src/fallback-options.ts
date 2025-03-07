import { ResponseError } from './response-error'
import type { FallbackOptions } from './types'
import { isJsonifiable } from './utils'

export const fallbackOptions: FallbackOptions = {
   parseResponse: (res) =>
      // https://github.com/unjs/ofetch/issues/324
      res.body || (res as any)._bodyInit ? res[getParsingMethod(res)]() : null,

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

const jsonRegexp = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i
const textRegexp = /^(?:image\/svg|application\/(?:xml|xhtml|html))$/i

const getParsingMethod = (
   response: Response,
): 'json' | 'text' | 'blob' | 'formData' => {
   const contentType = response.headers.get('content-type')?.split(';')[0]
   return !contentType || jsonRegexp.test(contentType)
      ? 'json'
      : contentType.startsWith('text/') || textRegexp.test(contentType)
        ? 'text'
        : 'blob'
}
