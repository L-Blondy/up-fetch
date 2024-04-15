import { ResponseError } from './response-error.js'
import {
   ComputedOptions,
   ParseResponse,
   ParseResponseError,
   ParseUnexpectedError,
   SerializeBody,
   SerializeParams,
} from './types.js'

export type DefaultOptions = {
   parseResponse: ParseResponse<any>
   parseResponseError: ParseResponseError<any>
   parseUnexpectedError: ParseUnexpectedError<any>
   serializeParams: SerializeParams
   serializeBody: SerializeBody
}

export let defaultOptions: DefaultOptions = {
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
      new ResponseError(
         res,
         await defaultOptions.parseResponse(res, {} as any), // the second arg is not used but required in the type
         options,
      ),

   parseUnexpectedError: (error: any) => error,

   serializeParams: (params: ComputedOptions['params']) =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params))).toString(),

   serializeBody: (val: any) => JSON.stringify(val),
}
