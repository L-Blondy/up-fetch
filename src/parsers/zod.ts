import { defaultOptions } from 'src/default-options.js'
import { ComputedOptions } from 'src/types.js'
import { ZodSchema } from 'zod'

export function withZod<TOutput>(schema: ZodSchema<TOutput, any, any>) {
   return async (response: Response, options: ComputedOptions) =>
      schema.parse(await defaultOptions.parseResponse(response, options))
}
