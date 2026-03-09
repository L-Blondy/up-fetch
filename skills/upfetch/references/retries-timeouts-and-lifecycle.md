# Retries, timeouts, and lifecycle

## Retry defaults

- Built-in retry defaults are `attempts: 0`, `delay: 0`.
- `retry.when` receives `{ request, response, error }`.
- If `retry.when` returns false, `attempts` and `delay` are not evaluated.

```ts
const upfetch = up(fetch, () => ({
   retry: {
      attempts: 2,
      delay: 1000,
      when: ({ response, error }) =>
         error?.name === 'TimeoutError' || response?.status === 429,
   },
}))
```

## Timeout behavior

- Timeout is applied per attempt.
- `withTimeout()` combines `signal` and `timeout` when the runtime supports `AbortSignal.any`.
- `AbortError` and `TimeoutError` remain distinct.

## Lifecycle order

1. Build defaults with `getDefaultOptions`
2. Merge fallback options, defaults, and request options
3. Serialize request body and headers
4. Resolve URL and construct `Request`
5. Run `onRequest`
6. Execute fetch
7. Evaluate retry policy and `onRetry`
8. After retries finish, run `onResponse`
9. Run `reject`
10. Run `parseRejected` or `parseResponse`
11. Validate `schema` if present
12. Run `onSuccess` or `onError`

## Hook guidance

- `onRequest` can mutate the `Request`.
- `onResponse` runs once after all retries complete.
- `onRetry` is the per-retry hook.
- `onSuccess` runs after parsing and validation.
- `onError` receives parser errors, validation errors, response errors, and thrown unknown errors.

## Source anchors

- [src/up.ts#L72](/Users/laurent/repos/up-fetch/src/up.ts#L72)
- [src/up.ts#L112](/Users/laurent/repos/up-fetch/src/up.ts#L112)
- [src/up.ts#L138](/Users/laurent/repos/up-fetch/src/up.ts#L138)
- [src/fallback-options.ts#L32](/Users/laurent/repos/up-fetch/src/fallback-options.ts#L32)
- [README.md#L223](/Users/laurent/repos/up-fetch/README.md#L223)
