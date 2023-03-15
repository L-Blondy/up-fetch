const isResponseErrorSymbol = Symbol.for('ResponseError')

export class ResponseError<TErrorData = any> extends Error {
   data: TErrorData
   headers: Headers
   redirected: boolean
   url: string
   type: ResponseType
   status: number
   statusText: string
   name: 'ResponseError';
   [isResponseErrorSymbol]: true

   constructor(res: Response, data: TErrorData) {
      const message = `Request failed with status ${res.status}`
      super(message)
      this.data = data
      this.headers = new Headers(res.headers)
      this.name = 'ResponseError'
      this.redirected = res.redirected
      this.url = res.url
      this.type = res.type
      this.status = res.status
      this.statusText = res.statusText
      this[isResponseErrorSymbol] = true
   }

   toJSON() {
      return {
         ...this,
         message: this.message,
         stack: this.stack,
      }
   }
}

export const isResponseError = (error: any): error is ResponseError => {
   return !!error[isResponseErrorSymbol]
}
