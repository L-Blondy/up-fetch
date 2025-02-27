# Migrating to up-fetch v2

## Overview

Version 2 of up-fetch focuses on simplifying the API and aligning more closely with web standards. The changes primarily affect advanced use cases and deprecated features, making it safe to upgrade for most users.

## Quick Start

```bash
npm i up-fetch@2.0.0-beta.0
```

## Breaking Changes

### 1. Renamed Options

The following options have been renamed for better clarity:

| v1 Option            | v2 Option       | Available Since |
| -------------------- | --------------- | --------------- |
| `throwResponseError` | `reject`        | v1.3.4          |
| `parseResponseError` | `parseRejected` | v1.3.4          |

#### Migration Example

```typescript
// Before (v1)
const upfetch = up(fetch, () => ({
   throwResponseError: (res) => !res.ok,
   parseResponseError: (res) => new Error('Ooops'),
}))

// After (v2)
const upfetch = up(fetch, () => ({
   reject: (res) => !res.ok,
   parseRejected: (res) => new Error('Ooops'),
}))
```

### 2. Callback Signatures

All callbacks now receive a standard `Request` object instead of resolved options, aligning with web standards.

#### Migration Example

```ts
// Before (v1)
up(fetch, () => ({
   onError: (error, options) => console.log(options.input),
   onRequest: (options) => console.log(options.input),
   onSuccess: (data, options) => console.log(options.input),
   parseResponse: (response, options) => console.log(options.input),
   parseRejected: (response, options) => console.log(options.input),
}))

// After (v2)
up(fetch, () => ({
   onError: (error, request) => console.log(request.url),
   onRequest: (request) => console.log(request.url),
   onSuccess: (data, request) => console.log(request.url),
   parseResponse: (response, request) => console.log(request.url),
   parseRejected: (response, request) => console.log(request.url),
}))
```

### 3. ResponseError Change

The `ResponseError` now receives the `request` object instead of `options`.

```typescript
// Before (v1)
try {
   await upfetch('/api')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.options)
   }
}

// After (v2)
try {
   await upfetch('/api')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.request)
   }
}
```

## Need Help?

If you encounter any issues during migration, please [open an issue](https://github.com/L-Blondy/up-fetch/issues) on GitHub.
