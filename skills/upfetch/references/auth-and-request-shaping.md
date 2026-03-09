# Auth and request shaping

## Auth defaults

- Read auth dynamically inside `up()`.
- Prefer request-scoped headers, cookies, or runtime-specific token sources over assuming `localStorage`.
- Remove inherited defaults with `undefined`, not empty strings.

```ts
import { up } from 'up-fetch'

export const upfetch = up(fetch, () => ({
   headers: {
      Authorization: readAuthHeader() ?? undefined,
   },
}))

function readAuthHeader() {
   if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('token')
      return token ? `Bearer ${token}` : undefined
   }
   return undefined
}
```

## Params

- Use `params` instead of hand-building query strings.
- The default serializer is simple and uses `URLSearchParams`.
- Use `query-string` when nested objects or arrays need richer serialization.

```ts
import queryString from 'query-string'
import { up } from 'up-fetch'

export const upfetch = up(fetch, () => ({
   serializeParams: (params) => queryString.stringify(params),
}))
```

## Body

- Jsonifiable objects are stringified automatically.
- `serializeBody` receives any non-nullish body.
- If `serializeBody` returns `FormData`, let the browser set the multipart boundary.

```ts
const form = new FormData()
form.append('file', new Blob(['hello']), 'hello.txt')

await upfetch('/upload', {
   method: 'POST',
   body: form,
})
```

## Merge rules

- `headers`: defaults merge with request headers, request values win.
- `params`: default params merge with input URL params and request params.
- Input URL params are preserved and are not passed into `serializeParams`.

## Source anchors

- [src/up.ts#L54](/Users/laurent/repos/up-fetch/src/up.ts#L54)
- [src/up.ts#L59](/Users/laurent/repos/up-fetch/src/up.ts#L59)
- [src/fallback-options.ts#L21](/Users/laurent/repos/up-fetch/src/fallback-options.ts#L21)
- [README.md#L361](/Users/laurent/repos/up-fetch/README.md#L361)
- [README.md#L561](/Users/laurent/repos/up-fetch/README.md#L561)
- [README.md#L575](/Users/laurent/repos/up-fetch/README.md#L575)
