import type { StandardSchemaV1 } from '@standard-schema/spec'

export class ValidationError extends Error {
   override name: 'ValidationError'
   issues: readonly StandardSchemaV1.Issue[]

   constructor(result: StandardSchemaV1.FailureResult) {
      super('Validation error')
      this.name = 'ValidationError'
      this.issues = result.issues
   }
}

export let isValidationError = (error: any): error is ValidationError =>
   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
   error.name === 'ValidationError'
