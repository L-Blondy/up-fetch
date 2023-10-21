import { ResponseError } from './response-error.js'
import {
   BuiltOptions,
   ParseResponse,
   ParseResponseError,
   SerializeBody,
} from './types.js'

export const defaultOptions = {
   parseResponse: ((res: Response) =>
      res
         .clone()
         .json()
         .catch(() => res.text())
         .then((data) => data)) satisfies ParseResponse<any>,

   parseResponseError: (async (
      res: Response,
      options: BuiltOptions,
   ): Promise<ResponseError> =>
      new ResponseError(
         res,
         await defaultOptions.parseResponse(res),
         options,
      )) satisfies ParseResponseError as ParseResponseError,

   serializeParams: (params: BuiltOptions['params']) =>
      // JSON.parse(JSON.stringify(params)) recursively transforms Dates to ISO strings and strips undefined
      new URLSearchParams(JSON.parse(JSON.stringify(params))).toString(),

   serializeBody: JSON.stringify as any as SerializeBody,
}
