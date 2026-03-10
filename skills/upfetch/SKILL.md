---
name: upfetch
description: >
   Load this skill for any up-fetch task: `up(fetch, getDefaultOptions?)`,
   `upfetch(url, options?)`. Covers dynamic defaults, auth, request shaping,
   validation, error handling, lifecycle timing, and runtime caveats.
type: core
library: up-fetch
library_version: '2.6.0'
sources:
   - 'L-Blondy/up-fetch:README.md'
   - 'L-Blondy/up-fetch:src/up.ts'
   - 'L-Blondy/up-fetch:src/types.ts'
   - 'L-Blondy/up-fetch:src/fallback-options.ts'
   - 'L-Blondy/up-fetch:src/utils.ts'
   - 'L-Blondy/up-fetch:src/stream.ts'
   - 'L-Blondy/up-fetch:src/tests/*.spec.ts'
   - 'L-Blondy/up-fetch:CHANGELOG.md'
---

# upfetch

Use `up-fetch` when you need a reusable fetch client with request-scoped defaults, automatic request/response shaping, runtime validation, retries, and lifecycle hooks.

## Mental model

- `up(fetchFn, getDefaultOptions?)` creates the reusable client.
- `getDefaultOptions(input, options, ctx)` runs on every request.
- `upfetch(input, options?, ctx?)` performs one request.
- Keep `SKILL.md` high-level; load the relevant file under `references/` for details.

## Minimum pattern

```ts
import { up } from 'up-fetch'
import { z } from 'zod'

export const upfetch = up(fetch, () => ({
   baseUrl: 'https://api.example.com',
   headers: {
      Authorization: readToken() ? `Bearer ${readToken()}` : undefined,
   },
   timeout: 5000,
}))

const user = await upfetch('/users/1', {
   schema: z.object({
      id: z.number(),
      name: z.string(),
   }),
})
```

## Workflow

1. Start with [client setup and dynamic defaults](references/client-setup-and-dynamic-defaults.md).
2. If the request needs auth, params, body shaping, or merge semantics, read [auth and request shaping](references/auth-and-request-shaping.md).
3. If the response contract matters, read [validation, parsing, and errors](references/validation-parsing-and-errors.md).
4. If retries, timeouts, or hook timing matter, read [retries, timeouts, and lifecycle](references/retries-timeouts-and-lifecycle.md).
5. If streaming or runtime quirks matter, read [streaming and runtime caveats](references/streaming-and-runtime-caveats.md).

## High-value rules

- Pass a function as the second argument to `up()`, not a plain object.
- Read auth and other mutable defaults inside that function so values stay fresh.
- Use `params` and `body` instead of hand-serializing query strings or JSON.
- Use `schema` when you need runtime trust; TypeScript generics alone do not validate payloads.
- If you want error-as-value behavior, set `reject: () => false` before relying on `parseResponse`.
- Prefer `globalThis.fetch` over imported `undici.fetch`.

## References

- [Client setup and dynamic defaults](references/client-setup-and-dynamic-defaults.md)
- [Auth and request shaping](references/auth-and-request-shaping.md)
- [Validation, parsing, and errors](references/validation-parsing-and-errors.md)
- [Retries, timeouts, and lifecycle](references/retries-timeouts-and-lifecycle.md)
- [Streaming and runtime caveats](references/streaming-and-runtime-caveats.md)
