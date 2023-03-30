import { FetchLike, RequestOptions } from 'src/createFetcher.js'

const waitFor = (ms = 0) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms))

export function withRetry<F extends FetchLike>(fetchFn: F) {
   const fetcher = async (
      url: string,
      opts: RequestOptions<any, any>,
      count = 0,
   ): Promise<Response> => {
      // const controller = new AbortController()
      // const signal = controller.signal
      // console.log({ ...opts, signal })
      // opts.timeout && waitFor(opts.timeout).then(() => controller.abort())
      const res = await fetchFn(url, opts)
      return res.ok || count === opts.retryTimes || !opts.retryWhen?.(res)
         ? res
         : waitFor(opts.retryDelay(++count, res)).then(() => fetcher(url, opts, count))
   }
   return fetcher
}
