# Changelog

## [1.0.0-beta.0](https://github.com/L-Blondy/tw-colors/compare/v1.0.0-beta.0...v0.7.0) - 2025.01-28

### Added

- Added the `schema` option following the [Standard Schema Specification](https://github.com/standard-schema/standard-schema)
- Added the `onError` hook on `up`

### Removed

- removed all `upfetch` hooks (on\*\*\*)
- remove all `up` error hooks (on\*\*\*Error) in fvor of `onError`
- removed the `transform` option

## [0.7.0](https://github.com/L-Blondy/tw-colors/compare/v0.7.0...v0.6.0) - 2024-05-06

### Added

- Added `transform` option

### Removed

- remove the `withTranform` adapter

### Improvements

- Better `options` type inferrence in the interceptors
