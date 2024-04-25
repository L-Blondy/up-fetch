import { fallbackOptions } from 'src/fallback-options'
import { ComputedOptions } from 'src/types'
import { ZodSchema } from 'zod'

export function withZod<TOutput>(schema: ZodSchema<TOutput, any, any>) {
   return async (response: Response, options: ComputedOptions) =>
      schema.parse(await fallbackOptions.parseResponse(response, options))
}
