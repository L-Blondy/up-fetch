import { defaultOptions } from 'src/default-options'
import { ComputedOptions } from 'src/types'
import { BaseSchema, parse } from 'valibot'

export function withValibot<TOutput>(schema: BaseSchema<any, TOutput>) {
   return async (response: Response, options: ComputedOptions) =>
      parse(schema, await defaultOptions.parseResponse(response, options))
}
