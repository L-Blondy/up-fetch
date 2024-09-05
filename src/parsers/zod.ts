import { fallbackOptions } from 'src/fallback-options'
import type { ComputedOptions } from 'src/types'
import { ZodSchema } from 'zod'

export function withZod<TOutput>(schema: ZodSchema<TOutput, any, any>) {
   return async (response: Response, options: ComputedOptions<any>) =>
      schema.parse(await fallbackOptions.parseResponse(response, options))
}
