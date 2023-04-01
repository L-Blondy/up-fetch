import { RequestOptions } from './createFetcher.js'

export class ResponseError<TErrorData = any> extends Error {
   // @ts-ignore
   override name: 'ResponseError'
   response: {
      data: TErrorData
      headers: Headers
      redirected: boolean
      url: string
      type: ResponseType
      status: number
      statusText: string
   }
   options: RequestOptions<any, any>

   constructor(res: Response, data: TErrorData, options: RequestOptions<any, any>) {
      super(`Request failed with status ${res.status}`)
      let { headers, redirected, url, type, status, statusText } = res
      this.name = 'ResponseError'
      this.response = { headers, redirected, url, type, status, statusText, data }
      this.options = options
   }
}

export let isResponseError = <D>(error: any): error is ResponseError<D> =>
   error instanceof ResponseError
