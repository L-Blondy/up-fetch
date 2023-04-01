import { RequestOptions } from './createFetcher.js'

export class ResponseError<TErrorData = any> extends Error {
   override name: 'ResponseError'
   response: Response & { data: TErrorData }
   options: RequestOptions<any, any>

   constructor(res: Response, data: TErrorData, options: RequestOptions<any, any>) {
      super(`Request failed with status ${res.status}`)
      let resWithData: any = res.clone()
      resWithData.data = data
      this.name = 'ResponseError'
      this.response = resWithData
      this.options = options
   }
}

export let isResponseError = <D>(error: any): error is ResponseError<D> =>
   error instanceof ResponseError
