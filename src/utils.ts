import { ResponseError } from './ResponseError'
import { BuiltOptions } from './types'

export const utils = {
   parseResponse: (res: Response) =>
      res
         .clone()
         .json()
         .catch(() => res.text())
         .then((data) => data || null),

   parseResponseError: async (res: Response, options: BuiltOptions): Promise<ResponseError> =>
      new ResponseError(res, await utils.parseResponse(res), options),
}
