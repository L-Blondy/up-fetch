import type { StandardSchemaV1 } from '@standard-schema/spec'

export class ValidationError<TData = any> extends Error {
   override name: 'ValidationError'
   issues: readonly StandardSchemaV1.Issue[]
   data: TData

   constructor(result: StandardSchemaV1.FailureResult, data: TData) {
      super('Validation error')
      this.name = 'ValidationError'
      this.issues = result.issues
      this.data = data
   }
}

export const isValidationError = (error: any): error is ValidationError =>
   error instanceof ValidationError
