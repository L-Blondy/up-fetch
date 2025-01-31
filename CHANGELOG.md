# Changelog

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
