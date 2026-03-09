export type { StandardSchemaV1 } from '@standard-schema/spec'
export { isResponseError, ResponseError } from './response-error'
export type {
   DefaultOptions,
   FetcherOptions,
   GetDefaultParsedData,
   GetDefaultRawBody,
   RetryOptions,
   UpFetch,
} from './types'
export { up } from './up'
export { isJsonifiable } from './utils'

import {
   isResponseValidationError,
   ResponseValidationError,
} from './validation-error'

/**
 * @deprecated Use `ResponseValidationError` instead.
 */
const ValidationError = ResponseValidationError
/**
 * @deprecated Use `isResponseValidationError` instead.
 */
const isValidationError = isResponseValidationError

export {
   ValidationError,
   isValidationError,
   isResponseValidationError,
   ResponseValidationError,
}
