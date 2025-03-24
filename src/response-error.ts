export class ResponseError<TData = any> extends Error {
   override name: 'ResponseError'
   response: Response
   request: Request
   data: TData
   status: number

   constructor(res: Response, data: TData, request: Request) {
      super(`[${res.status}] ${res.statusText}`)
      this.data = data
      this.name = 'ResponseError'
      this.response = res
      this.status = res.status
      this.request = request
   }
}

export const isResponseError = <TData = any>(
   error: unknown,
): error is ResponseError<TData> => error instanceof ResponseError
