import { ComputedOptions } from './types'

export class ResponseError<TData = any> extends Error {
   override name: 'ResponseError'
   response: Response
   options: ComputedOptions<TData>
   data: TData
   status: number

   constructor(res: Response, data: TData, options: ComputedOptions<TData>) {
      super(`Request failed with status ${res.status}`)
      this.data = data
      this.name = 'ResponseError'
      this.response = res
      this.status = res.status
      this.options = options
   }
}

export let isResponseError = <TData>(
   error: any,
): error is ResponseError<TData> => error instanceof ResponseError
