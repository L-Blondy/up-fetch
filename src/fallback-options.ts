import { ResponseError } from './response-error'
import {
   ComputedOptions,
   ParseResponse,
   ParseResponseError,
   SerializeBody,
   SerializeParams,
} from './types.js'
import { MaybePromise } from './utils'

export type FallbackOptions = {
   parseResponse: ParseResponse<any>
   parseResponseError: ParseResponseError<any>
   serializeParams: SerializeParams
   serializeBody: SerializeBody
   throwResponseErrorWhen: (response: Response) => MaybePromise<boolean>
}

export let fallbackOptions: FallbackOptions = {
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
         await fallbackOptions.parseResponse(res, {} as any), // the second arg is not used but required by the parseResponse type
         options,
      ),

   serializeParams: (params: ComputedOptions['params']) =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params))).toString(),

   serializeBody: (val: any) => JSON.stringify(val),

   throwResponseErrorWhen: (response: Response) => !response.ok,
}
