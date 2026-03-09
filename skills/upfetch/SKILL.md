---
name: upfetch
description: >
   Load this skill for any up-fetch task: `up(fetch, getDefaultOptions?)`,
   `upfetch(url, options?)`, `schema`, `params`, `serializeBody`,
   `serializeParams`, `retry`, `timeout`, `parseResponse`, `parseRejected`,
   `onRequest`, `onResponse`, `onSuccess`, `onError`, `onRequestStreaming`,
   and `onResponseStreaming`. Covers dynamic defaults, auth, request shaping,
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

Use `up-fetch` when you want a fetch-like client with reusable defaults, automatic body and response handling, runtime validation, and explicit request lifecycle hooks. The critical mental model is that `up()` creates the client and computes defaults per request, while `upfetch()` performs one request with an options object.

## Setup

```ts
import { up } from 'up-fetch'
import { z } from 'zod'

export const upfetch = up(fetch, (input) => ({
   baseUrl: 'https://api.example.com',
   headers: {
      Authorization: `Bearer ${getToken()}`,
   },
   timeout: 5000,
}))

function getToken() {
   return typeof window !== 'undefined'
      ? window.localStorage.getItem('token')
      : null
}

const user = await upfetch('/private/users/1', {
   schema: z.object({
      id: z.number(),
      name: z.string(),
   }),
})
```

## Core Patterns

### Create one client and keep defaults dynamic

```ts
import { up } from 'up-fetch'

export const upfetch = up(fetch, (input, options) => ({
   baseUrl: 'https://api.example.com',
   params: {
      locale:
         typeof input === 'string' && input.startsWith('/public/')
            ? 'en'
            : undefined,
   },
   timeout:
      typeof input === 'string' && input.startsWith('/exports/') ? 30000 : 5000,
}))
```

The second argument of `up()` is where request-aware defaults belong.

### Let upfetch shape params and body

```ts
const posts = await upfetch('/posts', {
   method: 'POST',
   params: { draft: true, take: 10 },
   body: { title: 'Hello', tags: ['ts', 'fetch'] },
})
```

Plain objects are serialized for you, and params are appended after URL resolution.

### Use schemas for runtime-safe responses

```ts
import { object, string, number } from 'valibot'

const todo = await upfetch('/todos/1', {
   schema: object({
      id: number(),
      title: string(),
   }),
})
```

Prefer `schema` over generic-only typing when the payload must be trustworthy at runtime.

### Customize failure behavior explicitly

```ts
const upfetch = up(fetch, () => ({
   reject: () => false,
   parseResponse: async (response) => {
      const json = await response.json()
      return response.ok
         ? { data: json, error: null }
         : { data: null, error: json }
   },
}))

const result = await upfetch('/users/1')
```

If you want error-as-value behavior, disable rejection first.

## Common Mistakes

### CRITICAL Pass an object to `up()`

Wrong:

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, {
   baseUrl: 'https://api.example.com',
})
```

Correct:

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   baseUrl: 'https://api.example.com',
}))
```

`up()` only accepts a fetch function and an optional defaults factory, because plain objects would freeze values that are meant to stay dynamic.

Source: maintainer interview

### CRITICAL Freeze auth outside the defaults factory

Wrong:

```ts
const token = window.localStorage.getItem('token')

const upfetch = up(fetch, () => ({
   headers: { Authorization: `Bearer ${token}` },
}))
```

Correct:

```ts
const upfetch = up(fetch, () => {
   const token = window.localStorage.getItem('token')
   return {
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
   }
})
```

Values read outside `up()` are captured once and become stale across later requests.

Source: [README.md](/Users/laurent/repos/up-fetch/README.md#L361) ; maintainer interview

### HIGH Type the response without a schema

Wrong:

```ts
const todo = await upfetch<{ id: number; title: string }>('/todos/1')

console.log(todo.id)
```

Correct:

```ts
import { z } from 'zod'

const todo = await upfetch('/todos/1', {
   schema: z.object({
      id: z.number(),
      title: z.string(),
   }),
})
```

Generic annotations do not validate runtime data, and unschematized calls default to `any`.

Source: maintainer interview; [src/up.ts#L145](/Users/laurent/repos/up-fetch/src/up.ts#L145)

### HIGH Build query strings and JSON by hand

Wrong:

```ts
await upfetch(`/todos?search=${search}&skip=${skip}`, {
   method: 'POST',
   body: JSON.stringify({ title: 'New Todo' }),
})
```

Correct:

```ts
await upfetch('/todos', {
   method: 'POST',
   params: { search, skip },
   body: { title: 'New Todo' },
})
```

`up-fetch` already manages param serialization and JSON-stringifiable bodies, so manual shaping duplicates logic and creates drift.

Source: [README.md#L111](/Users/laurent/repos/up-fetch/README.md#L111) ; [README.md#L131](/Users/laurent/repos/up-fetch/README.md#L131)

### HIGH Return errors as values without disabling rejection

Wrong:

```ts
const upfetch = up(fetch, () => ({
   parseResponse: async (response) => {
      const json = await response.json()
      return { data: json, error: null }
   },
}))
```

Correct:

```ts
const upfetch = up(fetch, () => ({
   reject: () => false,
   parseResponse: async (response) => {
      const json = await response.json()
      return response.ok
         ? { data: json, error: null }
         : { data: null, error: json }
   },
}))
```

`parseResponse` only runs after the rejection check, so the default `reject` path throws before your value-returning parser is used.

Source: [README.md#L502](/Users/laurent/repos/up-fetch/README.md#L502) ; [src/up.ts#L142](/Users/laurent/repos/up-fetch/src/up.ts#L142)

### HIGH Assume lifecycle hooks run when you expect

Wrong:

```ts
const upfetch = up(fetch, () => ({
   onResponse() {
      console.log('this runs once per retry attempt')
   },
   onSuccess() {
      console.log('this runs before parsing')
   },
}))
```

Correct:

```ts
const upfetch = up(fetch, () => ({
   onRetry() {
      console.log('this runs before each retry')
   },
   parseResponse(response) {
      return response.json()
   },
   onSuccess(data) {
      console.log('this runs after parsing and schema validation', data)
   },
}))
```

`onRequest` runs before fetch, `onRetry` runs during retry scheduling, `onResponse` runs once after retries complete, and `onSuccess` runs after parsing and validation.

Source: [src/up.ts#L92](/Users/laurent/repos/up-fetch/src/up.ts#L92) ; [src/up.ts#L138](/Users/laurent/repos/up-fetch/src/up.ts#L138)

### CRITICAL Pass imported `undici.fetch` to `up()`

Wrong:

```ts
import { fetch } from 'undici'
import { up } from 'up-fetch'

const upfetch = up(fetch)
```

Correct:

```ts
import { up } from 'up-fetch'

const upfetch = up(globalThis.fetch)
```

`up-fetch` constructs a standard `Request`, and imported `undici.fetch` is not compatible with that request shape.

Source: [src/tests/undici.spec.ts](/Users/laurent/repos/up-fetch/src/tests/undici.spec.ts) ; issue #49

## References

- [Client setup and dynamic defaults](references/client-setup-and-dynamic-defaults.md)
- [Auth and request shaping](references/auth-and-request-shaping.md)
- [Validation, parsing, and errors](references/validation-parsing-and-errors.md)
- [Retries, timeouts, and lifecycle](references/retries-timeouts-and-lifecycle.md)
- [Streaming and runtime caveats](references/streaming-and-runtime-caveats.md)
