import { ResponseError } from './response-error.js'
import { BuiltOptions, DefaultOptions } from './types.js'

export const defaultOptions = {
   parseResponse: (res: Response) =>
      res
         .clone()
         .json()
         .catch(() => res.text())
         .then((data) => data),

   parseResponseError: async (
      res: Response,
      options: BuiltOptions,
   ): Promise<ResponseError> =>
      new ResponseError(res, await defaultOptions.parseResponse(res), options),

   serializeParams: (params: BuiltOptions['params']) =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params))).toString(),

   serializeBody: (val: any) => JSON.stringify(val),
} satisfies DefaultOptions
