# Validation, parsing, and errors

## Response validation

- `schema` validates the parsed response, not the request.
- Use a Standard Schema implementation such as Zod `3.24+` or Valibot `1.0+`.
- If you want an explicit safe boundary without validating shape yet, use `schema: z.unknown()`.

```ts
import { z } from 'zod'

const user = await upfetch('/users/1', {
   schema: z.object({
      id: z.number(),
      name: z.string(),
   }),
})
```

## Default parsing

- Success responses: JSON first, then text, otherwise `null`.
- Rejected responses: wrapped in `ResponseError`.
- `reject(response)` decides whether `parseRejected` or `parseResponse` runs.

## Error-as-value pattern

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

## Custom error parsing

```ts
import { ResponseError, up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   parseRejected: async (response, request) => {
      const data = await response.json()
      return new ResponseError({
         message: `Request failed with status ${response.status}`,
         response,
         request,
         data,
      })
   },
}))
```

## Legacy names to avoid

- `throwResponseError` -> use `reject`
- `parseResponseError` -> use `parseRejected`

## Source anchors

- [src/up.ts#L142](/Users/laurent/repos/up-fetch/src/up.ts#L142)
- [src/fallback-options.ts#L5](/Users/laurent/repos/up-fetch/src/fallback-options.ts#L5)
- [README.md#L156](/Users/laurent/repos/up-fetch/README.md#L156)
- [README.md#L320](/Users/laurent/repos/up-fetch/README.md#L320)
- [README.md#L500](/Users/laurent/repos/up-fetch/README.md#L500)
