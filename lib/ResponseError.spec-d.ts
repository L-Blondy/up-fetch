import { expectTypeOf, test } from 'vitest'
import { ResponseError, isResponseError } from './ResponseError.js'

test('ResponseError should infer the typeof data', () => {
   const error = new ResponseError(new Response(), 'string', {} as any)
   expectTypeOf(error.response.data).toBeString()
})

test('`isResponseError<number>(error)` should infer `error.response.data` to be `number`', () => {
   const error = new ResponseError(new Response(), {} as any, {} as any)
   if (isResponseError<number>(error)) {
      expectTypeOf(error.response.data).toBeNumber()
   }
})
