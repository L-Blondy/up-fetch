export class ResponseError<TData = any> extends Error {
   response: Response
   request: Request
   data: TData
   status: number

   constructor(props: {
      message: string
      response: Response
      data: TData
      request: Request
   }) {
      // super(`[${response.status}] ${response.statusText}`)
      super(props.message)
      this.name = 'ResponseError'
      this.response = props.response
      this.request = props.request
      this.data = props.data
      this.status = props.response.status
   }
}

export const isResponseError = <TData = any>(
   error: unknown,
): error is ResponseError<TData> => error instanceof ResponseError
