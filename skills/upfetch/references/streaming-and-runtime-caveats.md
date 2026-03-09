# Streaming and runtime caveats

## Streaming model

- `onRequestStreaming` instruments upload progress.
- `onResponseStreaming` instruments download progress.
- The first callback receives an empty chunk and the initial byte counters.
- `totalBytes` can be `undefined` when `Content-Length` is unavailable.

```ts
await upfetch('/download', {
   onResponseStreaming({ chunk, transferredBytes, totalBytes = transferredBytes }) {
      console.log(chunk, transferredBytes, totalBytes)
   },
})
```

## Runtime caveats

- Imported `undici.fetch` is not compatible with `up-fetch`; use `globalThis.fetch`.
- Accessing `fetch` dynamically is a fallback for niche cases where another tool patches global fetch later, such as MSW setup timing.
- Safari/WebKit upload streaming support is limited; `onRequestStreaming` can be unavailable there.
- Empty request or response bodies do not guarantee streaming callbacks.

## Dynamic fetch fallback

```ts
import { up } from 'up-fetch'

const upfetch = up((...args: Parameters<typeof fetch>) => fetch(...args))
```

Use that only when plain `up(fetch)` misses a patched global fetch implementation.

## Source anchors

- [src/stream.ts#L12](/Users/laurent/repos/up-fetch/src/stream.ts#L12)
- [src/stream.ts#L31](/Users/laurent/repos/up-fetch/src/stream.ts#L31)
- [src/stream.ts#L69](/Users/laurent/repos/up-fetch/src/stream.ts#L69)
- [src/tests/undici.spec.ts](/Users/laurent/repos/up-fetch/src/tests/undici.spec.ts)
- maintainer interview
