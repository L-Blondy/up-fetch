import { fallbackOptions } from 'src/fallback-options'
import { ComputedOptions } from 'src/types'
import { MaybePromise } from 'valibot'

export function withTransform<TOutput>(
   transformer: (data: any, response: Response) => MaybePromise<TOutput>,
) {
   return async (response: Response, options: ComputedOptions) =>
      await transformer(
         await fallbackOptions.parseResponse(response, options),
         response,
      )
}
