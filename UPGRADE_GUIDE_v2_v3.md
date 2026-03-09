# Upgrade guide: v2 -> v3

This document tracks the breaking changes currently planned for `up-fetch` v3 and how to migrate existing v2 code.

It is intentionally incremental: as the v3 branch evolves, new changes can be appended here.

## Summary

These are the changes currently introduced in this branch:

- `ValidationError` has been renamed to `ResponseValidationError`.
- `isValidationError` has been renamed to `isResponseValidationError`.
- `ResponseError` no longer exposes `request` and `response` properties.
- `ResponseError` now uses a tagged shape with `kind: 'response'`.
- `ResponseValidationError` now uses a tagged shape with `kind: 'validation'`.
- `ResponseError` now accepts a single object in its constructor.

## 1. ValidationError was renamed

### v2

```ts
import { isValidationError, ValidationError } from 'up-fetch'

try {
   await upfetch('/users/1', { schema })
} catch (error) {
   if (isValidationError(error)) {
      console.log(error.issues)
   }
}
```

### v3

```ts
import {
   isResponseValidationError,
   ResponseValidationError,
} from 'up-fetch'

try {
   await upfetch('/users/1', { schema })
} catch (error) {
   if (isResponseValidationError(error)) {
      console.log(error.issues)
   }
}
```

### What to change

- Replace `ValidationError` with `ResponseValidationError`.
- Replace `isValidationError(...)` with `isResponseValidationError(...)`.
- Update any local type annotations, imports, and tests that still reference the old names.

## 2. ResponseError constructor changed

In v2, `ResponseError` was constructed with an object containing `message`, `data`, `request`, and `response`.

In v3, the constructor still accepts an object, but its shape is now smaller and explicit:

```ts
new ResponseError({
   message,
   status,
   data,
})
```

### v2

```ts
return new ResponseError({
   message,
   data,
   request,
   response,
})
```

### v3

```ts
return new ResponseError({
   message,
   status: response.status,
   data,
})
```

### What to change

- Add `status` explicitly when creating a `ResponseError`.
- Stop passing `request` and `response` to the `ResponseError` constructor.
- Update custom `parseRejected` implementations to the new object shape.

## 3. ResponseError no longer stores request and response

In v2, a caught `ResponseError` exposed:

- `error.request`
- `error.response`
- `error.data`
- `error.status`

In v3, only the normalized error payload is stored on the error instance:

- `error.kind`
- `error.data`
- `error.status`

### v2

```ts
try {
   await upfetch('/users/1')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.response.headers)
   }
}
```

### v3

```ts
try {
   await upfetch('/users/1', {
      onError(error, request) {
         if (isResponseError(error)) {
            console.log(error.status)
            console.log(request.url)
         }
      },
   })
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.status)
      console.log(error.data)
   }
}
```

### Migration note

If your v2 code depended on `error.response`, you need to move that logic closer to the response lifecycle:

- Use `onResponse(response, request)` when you need direct access to the raw `Response`.
- Use `parseRejected(response, request)` when you want to build your own custom error from the rejected response.
- Use `onError(error, request)` for normalized error handling after the response has already been converted into an error.

## 4. Error type guards are now tag-based

The v2 code used class-based checks such as `instanceof ValidationError`.

The v3 code path is designed around explicit tags:

- `ResponseError` has `kind === 'response'`
- `ResponseValidationError` has `kind === 'validation'`

You should prefer the exported helpers:

```ts
isResponseError(error)
isResponseValidationError(error)
```

### What to change

- Replace direct `instanceof ValidationError` checks with `isResponseValidationError`.
- Prefer `isResponseError` over depending on internal class details.
- If you have custom narrowing utilities, update them to the new names and shapes.

## Migration checklist

- Update imports from `ValidationError` to `ResponseValidationError`.
- Update imports from `isValidationError` to `isResponseValidationError`.
- Update custom `new ResponseError(...)` calls to the new object shape.
- Remove any reads of `error.request` and `error.response` from caught `ResponseError` instances.
- Move raw response handling into `onResponse(...)` or `parseRejected(...)` where needed.
- Update tests and app code to assert `error.kind`, `error.status`, `error.data`, and `error.issues` instead of the removed properties.

## Notes

- `parseRejected(response, request)` still receives both `response` and `request`.
- The default fallback `parseRejected` simply does not store `request` or `response` on the produced `ResponseError`.
- This guide only covers the v3 changes currently present in this branch.
