import { ResponseError } from './response-error'
import {
   BaseFetchFn,
   ComputedOptions,
   ParseResponse,
   ParseResponseError,
   SerializeBody,
   SerializeParams,
} from './types.js'
import { MaybePromise } from './utils'

export type FallbackOptions<TFetchFn extends BaseFetchFn = typeof fetch> = {
   parseResponse: ParseResponse<any, TFetchFn>
   parseResponseError: ParseResponseError<any, TFetchFn>
   serializeParams: SerializeParams
   serializeBody: SerializeBody
   transform: (
      data: any,
      options: ComputedOptions<any, any, any, TFetchFn>,
   ) => MaybePromise<any>
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

   // TODO: find a lighter way to do this with about the same amount of code
   serializeParams: (params: ComputedOptions['params']) =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params))).toString(),

   serializeBody: (val: any) => JSON.stringify(val),

   transform: (x) => x,

   throwResponseErrorWhen: (response: Response) => !response.ok,
}
