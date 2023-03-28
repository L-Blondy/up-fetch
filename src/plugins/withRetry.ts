import { FetchLike } from 'src/createFetcher.js'

const waitFor = (ms = 0) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms))

export function withRetry<F extends FetchLike>(fetchFn: F) {
   type Url = Parameters<F>[0]
   type Options = Parameters<F>[1]
   type AddedOptions = {
      retryTimes?: number
      retryWhen?: (response: Response) => boolean
      retryDelay?: (attemptNumber: number, response: Response) => number
   }
   const fetcher = async (
      url: Url,
      {
         retryTimes = 0,
         // prettier-ignore
         retryDelay = (count) => 2000 * (1.5 ** (count - 1)),
         retryWhen = (res) => new Set([408, 413, 429, 500, 502, 503, 504]).has(res.status),
         ...options
      }: Options & AddedOptions = {},
      count = 0,
   ): Promise<Response> => {
      const res = await fetchFn(url, options)
      return count === retryTimes || !retryWhen?.(res)
         ? res
         : waitFor(retryDelay(++count, res)).then(() =>
              fetcher(url, { retryTimes, retryDelay, retryWhen, ...options }, count),
           )
   }
   return fetcher
}
