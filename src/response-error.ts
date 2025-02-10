import type { BaseFetchFn, ResolvedOptions } from './types'

export class ResponseError<
   TData = any,
   TFetchFn extends BaseFetchFn = typeof fetch,
> extends Error {
   override name: 'ResponseError'
   response: Response
   options: ResolvedOptions<TFetchFn>
   data: TData
   status: number

   constructor(res: Response, data: TData, options: ResolvedOptions<TFetchFn>) {
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
   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
): error is ResponseError<TData, TFetchFn> => error.name === 'ResponseError'
