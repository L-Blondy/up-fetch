import { UpFetchOptions } from './types.js'

export class ResponseError<TErrorData = any> extends Error {
   override name: 'ResponseError'
   response: Response & { data: TErrorData }
   options: UpFetchOptions<TErrorData>
   data: TErrorData

   constructor(
      res: Response,
      data: TErrorData,
      options: UpFetchOptions<TErrorData>,
   ) {
      super(`Request failed with status ${res.status}`)
      // because ResponseError is only instantiated during the response parsing,
      // mutating the response here is fine
      this.data = data
      this.name = 'ResponseError'
      this.response = res as any
      this.options = options
   }
}

export let isResponseError = <TErrorData>(
   error: any,
): error is ResponseError<TErrorData> => error instanceof ResponseError
