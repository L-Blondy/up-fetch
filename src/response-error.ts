import type { BaseFetchFn, ComputedOptions } from './types'

export class ResponseError<
   TFetchFn extends BaseFetchFn = typeof fetch,
   TData = any,
   TError = any,
   TParsedData = any,
> extends Error {
   override name: 'ResponseError'
   response: Response
   options: ComputedOptions<TFetchFn, TData, TError, TParsedData>
   data: TData
   status: number

   constructor(
      res: Response,
      data: TData,
      options: ComputedOptions<TFetchFn, TData, TError, TParsedData>,
   ) {
      super(`Request failed with status ${res.status}`)
      this.data = data
      this.name = 'ResponseError'
      this.response = res
      this.status = res.status
      this.options = options
   }
}

export let isResponseError = <
   TFetchFn extends BaseFetchFn = typeof fetch,
   TData = any,
   TError = any,
   TParsedData = any,
>(
   error: any,
): error is ResponseError<TFetchFn, TData, TError, TParsedData> =>
   error instanceof ResponseError
