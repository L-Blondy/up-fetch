import { upfetchFactory } from './upfetchFactory'
export { upfetchFactory } from './upfetchFactory'
export { ResponseError, isResponseError } from './ResponseError'
export const upfetch = upfetchFactory.create()
