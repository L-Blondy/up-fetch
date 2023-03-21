const isResponseErrorSymbol = Symbol()

export class ResponseError<TErrorData = any> extends Error {
   [isResponseErrorSymbol] = true
   override name: 'ResponseError'
   data: TErrorData
   headers: Headers
   redirected: boolean
   url: string
   type: ResponseType
   status: number
   statusText: string

   constructor(res: Response, data: TErrorData) {
      super(`Request failed with status ${res.status}`)
      this.name = 'ResponseError'
      this.data = data
      this.headers = res.headers
      this.redirected = res.redirected
      this.url = res.url
      this.type = res.type
      this.status = res.status
      this.statusText = res.statusText
   }
}

export const isResponseError = (error: any): error is ResponseError => {
   return !!error[isResponseErrorSymbol]
}
