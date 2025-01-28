import type { BaseFetchFn, ComputedOptions } from './types'

export class ResponseError<
   TData = any,
   TFetchFn extends BaseFetchFn = typeof fetch,
> extends Error {
   override name: 'ResponseError'
   response: Response
   options: ComputedOptions<TFetchFn>
   data: TData
   status: number

   constructor(res: Response, data: TData, options: ComputedOptions<TFetchFn>) {
      super(`Request failed with status ${res.status}`)
      this.data = data
      this.name = 'ResponseError'
      this.response = res
      this.status = res.status
      this.options = options
   }
}

export let isResponseError = <
   TData = any,
   TFetchFn extends BaseFetchFn = typeof fetch,
>(
   error: any,
): error is ResponseError<TData, TFetchFn> => error instanceof ResponseError
