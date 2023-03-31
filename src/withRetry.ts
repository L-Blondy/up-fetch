import { FetchLike, RequestOptions } from 'src/createFetcher.js'

let waitFor = (ms = 0) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms))

export const withRetry = <F extends FetchLike>(fetchFn: F) => {
   let fetcher = async (
      url: string,
      opts: RequestOptions<any, any>,
      count = 0,
   ): Promise<Response> => {
      let res = await fetchFn(url, opts)
      return res.ok || count === opts.retryTimes || !opts.retryWhen?.(res)
         ? res
         : waitFor(opts.retryDelay(++count, res)).then(() => fetcher(url, opts, count))
   }
   return fetcher
}
