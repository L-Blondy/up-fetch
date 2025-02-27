export class ResponseError<TData = any> extends Error {
   override name: 'ResponseError'
   response: Response
   request: Request
   data: TData
   status: number

   constructor(res: Response, data: TData, request: Request) {
      super(`Request failed with status ${res.status}`)
      this.data = data
      this.name = 'ResponseError'
      this.response = res
      this.status = res.status
      this.request = request
   }
}

export let isResponseError = <TData = any>(
   error: any,
): error is ResponseError<TData> => error instanceof ResponseError
