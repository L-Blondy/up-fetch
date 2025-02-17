# Changelog

## [1.3.0](https://github.com/L-Blondy/up-fetch/compare/v1.2.4...v1.3.0) - 2025.02-16

### Breaking changes

1. The `serializeBody` option now receives any non nullish body as its first argument. Previously it received jsonifiable values only.

   The valid `body` type can now be restricted by typing the `serializeBody` option's first argument.

   ```ts
   let upfetch = up(fetch, () => ({
      // accept FormData only
      serializeBody: (body: FormData) => body,
   }))

   // ❌ type error: the body is not a FormData
   upfetch('https://example.com', {
      method: 'POST',
      body: { name: 'John' },
   })

   // ✅ works fine with FormData
   upfetch('https://example.com', {
      method: 'POST',
      body: new FormData(),
   })
   ```

2. upfetch's 2nd argument no longer has a functional signature.
   Instead, `up` receives the fetcher arguments to tailor the defaults based on the request.

   Example:

   ```ts
   let upfetch = up(fetch, (input, options) => ({
      baseUrl: 'https://example.com',
      timeout:
         typeof input === 'string' && input.startsWith('/export/')
            ? 30000
            : 5000,
   }))
   ```

### Added

- new `isJsonifiable` utility to determine if a value can be safely converted to `json`

## [1.2.4](https://github.com/L-Blondy/up-fetch/compare/v1.2.3...v1.2.4) - 2025.02-11

## Added

- add a `ValidationError` along with an `isValidationError` type guard

## [1.2.3](https://github.com/L-Blondy/up-fetch/compare/v1.2.0...v1.2.3) - 2025.02-02

## Added

- `timeout` option, making it easier to set a timeout alogn with a signal.

## [1.2.0](https://github.com/L-Blondy/up-fetch/compare/v1.1.1...v1.2.0) - 2025.01-31

### Breaking changes

- renamed option `onBeforeFetch` to `onRequest`
- renamed type `ComputedOptions` to `ResolvedOptions`

## [1.1.1](https://github.com/L-Blondy/up-fetch/compare/v1.1.0...v1.1.1) - 2025.01-30

### Fixed

- Removed peerDependencies in package.json

## [1.1.0](https://github.com/L-Blondy/up-fetch/compare/v1.0.0...v1.1.0) - 2025.01-29

### Breaking changes

- renamed `parseResponseErrorWhen` to `parseResponseError`

## [1.0.0](https://github.com/L-Blondy/up-fetch/compare/v0.7.0...v1.0.0) - 2025.01-28

### Added

- Added the `schema` option following the [Standard Schema Specification](https://github.com/standard-schema/standard-schema)
- Added the `onError` hook on `up`

### Breaking changes

- removed all `upfetch` hooks (on\*\*\*)
- remove all `up` error hooks (on\*\*\*Error) in favor of `onError`
- removed the `transform` option

## [0.7.0](https://github.com/L-Blondy/up-fetch/compare/v0.6.0...v0.7.0) - 2024-05-06

### Added

- Added `transform` option

### Removed

- remove the `withTranform` adapter

### Improvements

- Better `options` type inferrence in the interceptors

```

```
