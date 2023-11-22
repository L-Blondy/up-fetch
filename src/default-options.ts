import { ResponseError } from './response-error.js'
import { ComputedOptions, DefaultOptions } from './types.js'

export let defaultOptions = {
   parseResponse: (res: Response) =>
      res
         .clone()
         .json()
         .catch(() => res.text())
         .then((data) => data || null),

   parseResponseError: async (
      res: Response,
      options: ComputedOptions,
   ): Promise<ResponseError> =>
      new ResponseError(res, await defaultOptions.parseResponse(res), options),

   parseUnknownError: (error: any) => error,

   serializeParams: (params: ComputedOptions['params']) =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params))).toString(),

   serializeBody: (val: any) => JSON.stringify(val),
} satisfies DefaultOptions
