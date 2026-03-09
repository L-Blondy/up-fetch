# Client setup and dynamic defaults

## Mental model

- `up(fetchFn, getDefaultOptions?)` creates the reusable client.
- `getDefaultOptions(input, fetcherOpts, ctx)` runs for every request.
- `upfetch(input, options?, ctx?)` performs one request with an options object.
- Default `body` is ignored; request `body` must be passed to `upfetch()`.

## Minimum patterns

### Static defaults

```ts
import { up } from 'up-fetch'

export const upfetch = up(fetch, () => ({
   baseUrl: 'https://api.example.com',
   timeout: 5000,
}))
```

### Request-aware defaults

```ts
import { up } from 'up-fetch'

export const upfetch = up(fetch, (input) => ({
   baseUrl:
      typeof input === 'string' && input.startsWith('/admin/')
         ? 'https://admin.example.com'
         : 'https://api.example.com',
   timeout:
      typeof input === 'string' && input.startsWith('/exports/')
         ? 30000
         : 5000,
}))
```

### Multiple clients

```ts
import { up } from 'up-fetch'

export const publicApi = up(fetch, () => ({
   baseUrl: 'https://api.example.com/public',
}))

export const privateApi = up(fetch, () => ({
   baseUrl: 'https://api.example.com/private',
}))
```

## Invariants

- The second argument of `up()` is a function or omitted.
- The second argument of `upfetch()` is an object.
- URL resolution happens before `onRequest`, so URL decisions belong in the defaults factory.

## Source anchors

- [src/up.ts#L23](/Users/laurent/repos/up-fetch/src/up.ts#L23)
- [src/up.ts#L76](/Users/laurent/repos/up-fetch/src/up.ts#L76)
- [README.md#L615](/Users/laurent/repos/up-fetch/README.md#L615)
