import type { StandardSchemaV1 } from '@standard-schema/spec'

export class ResponseValidationError<TData = any> extends Error {
   issues: readonly StandardSchemaV1.Issue[]
   kind: 'validation'
   data: TData

   constructor(result: StandardSchemaV1.FailureResult, data: TData) {
      super(JSON.stringify(result.issues))
      this.kind = 'validation'
      this.issues = result.issues
      this.data = data
   }
}

export const isResponseValidationError = (
   error: unknown,
): error is ResponseValidationError =>
   typeof error === 'object' &&
   (error as ResponseValidationError)?.kind === 'validation'
