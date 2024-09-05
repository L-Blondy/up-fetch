import { fallbackOptions } from 'src/fallback-options'
import type { ComputedOptions } from 'src/types'
import { type BaseSchema, parse } from 'valibot'

export function withValibot<TOutput>(schema: BaseSchema<any, TOutput>) {
   return async (response: Response, options: ComputedOptions<any>) =>
      parse(schema, await fallbackOptions.parseResponse(response, options))
}
