import { ResponseError } from './response-error'
import type {
   BaseFetchFn,
   ParseResponse,
   ParseResponseError,
   SerializeBody,
   SerializeParams,
} from './types'
import { type MaybePromise } from './utils'

export type FallbackOptions<TFetchFn extends BaseFetchFn, TError> = {
   parseResponse: ParseResponse<TFetchFn, any>
   parseResponseError: ParseResponseError<TFetchFn, TError>
   serializeParams: SerializeParams
   serializeBody: SerializeBody
   throwResponseErrorWhen: (response: Response) => MaybePromise<boolean>
}

export let fallbackOptions: FallbackOptions<any, any> = {
   parseResponse: (res) =>
      res
         .clone()
         .json()
         .catch(() => res.text())
         .then((data) => data || null),

   parseResponseError: async (res, options) =>
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

   serializeBody: (val: any) => JSON.stringify(val),

   throwResponseErrorWhen: (response) => !response.ok,
}
