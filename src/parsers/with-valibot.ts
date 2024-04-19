import { defaultOptions } from 'src/default-options.js'
import { ComputedOptions } from 'src/types.js'
import { BaseSchema, parse } from 'valibot'

export function withValibot<TOutput>(schema: BaseSchema<any, TOutput>) {
   return async (response: Response, options: ComputedOptions) => {
      const data = await defaultOptions.parseResponse(response, options)
      return parse(schema, data)
   }
}
