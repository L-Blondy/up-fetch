export class ResponseError<TData = any> extends Error {
   data: TData
   status: number
   kind: 'response'

   constructor(props: { message: string; status: number; data: TData }) {
      super(props.message)
      this.kind = 'response'
      this.data = props.data
      this.status = props.status
   }
}

export const isResponseError = <TData = any>(
   error: unknown,
): error is ResponseError<TData> =>
   typeof error === 'object' && (error as ResponseError)?.kind === 'response'
