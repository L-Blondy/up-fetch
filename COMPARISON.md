# Feature Comparison

_This table aims to provide an accurate comparison of fetch libraries, though there may be room for improvement. If you notice any discrepancies or have additional information to share, please submit a PR with supporting documentation._

## up-fetch vs ofetch vs wretch vs ky

Legend:

- ✅ Supported
- 🟧 Partially supported
- ❌ Not supported or not documented

| Feature                     | [up-fetch][up-fetch]                               | [ofetch][ofetch]                               | [wretch][wretch]                               | [ky][ky]                               |
| --------------------------- | -------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| Minzipped Size              | [![][up-fetch-size-badge]][up-fetch-size-link]     | [![][ofetch-size-badge]][ofetch-size-link]     | [![][wretch-size-badge]][wretch-size-link]     | [![][ky-size-badge]][ky-size-link]     |
| GitHub Issues               | [![][up-fetch-issues-badge]][up-fetch-issues-link] | [![][ofetch-issues-badge]][ofetch-issues-link] | [![][wretch-issues-badge]][wretch-issues-link] | [![][ky-issues-badge]][ky-issues-link] |
| Automatic Body Handling     | ✅                                                 | ✅                                             | ✅                                             | ✅                                     |
| Automatic Params Handling   | ✅                                                 | ✅                                             | ✅                                             | ✅                                     |
| Automatic Response Parsing  | ✅                                                 | ✅                                             | ✅                                             | ✅                                     |
| Custom Body Serializer      | ✅                                                 | ❌                                             | ❌                                             | ❌                                     |
| Custom Error Parser         | ✅                                                 | ❌                                             | 🟧                                             | ❌                                     |
| Custom Error Throwing       | ✅                                                 | ❌                                             | ❌                                             | ✅                                     |
| Custom Fetch Implementation | ✅                                                 | ❌                                             | ❌                                             | 🟧 (1)                                 |
| Custom Params Serializer    | ✅                                                 | ❌                                             | ❌                                             | ❌                                     |
| Custom Response Parser      | ✅                                                 | ✅                                             | 🟧                                             | 🟧                                     |
| Dynamic Default Headers     | ✅                                                 | 🟧                                             | 🟧                                             | 🟧                                     |
| Extendable instance         | ❌                                                 | ❌                                             | ✅                                             | ✅                                     |
| Hooks/Interceptors          | ✅                                                 | ✅                                             | ✅                                             | ✅                                     |
| Instance Configuration      | ✅                                                 | ✅                                             | ✅                                             | ✅                                     |
| Retry                       | ✅                                                 | ✅                                             | ✅                                             | ✅                                     |
| Schema Validation           | ✅                                                 | ❌                                             | ❌                                             | ❌                                     |
| Timeout                     | ✅                                                 | 🟧 (2)                                         | ✅                                             | ✅                                     |
| Zero Dependencies           | ✅                                                 | ❌                                             | ✅                                             | ✅                                     |

(1) fetch type is not inferred \
(2) timeout can't be used together with signal as per ofetch 1.4.1

<!-- libs -->

[ky]: https://github.com/sindresorhus/ky
[ofetch]: https://github.com/unjs/ofetch
[wretch]: https://github.com/elbywan/wretch
[up-fetch]: https://github.com/L-Blondy/up-fetch

<!-- badges -->

[up-fetch-size-badge]: https://img.shields.io/bundlephobia/minzip/up-fetch?label=
[up-fetch-size-link]: https://bundlephobia.com/package/up-fetch
[up-fetch-issues-badge]: https://img.shields.io/github/issues/L-Blondy/up-fetch
[up-fetch-issues-link]: https://github.com/L-Blondy/up-fetch/issues
[ofetch-size-badge]: https://img.shields.io/bundlephobia/minzip/ofetch?label=
[ofetch-size-link]: https://bundlephobia.com/package/ofetch
[ofetch-issues-badge]: https://img.shields.io/github/issues/unjs/ofetch
[ofetch-issues-link]: https://github.com/unjs/ofetch/issues
[wretch-size-badge]: https://img.shields.io/bundlephobia/minzip/wretch?label=
[wretch-size-link]: https://bundlephobia.com/package/wretch
[wretch-issues-badge]: https://img.shields.io/github/issues/elbywan/wretch
[wretch-issues-link]: https://github.com/elbywan/wretch/issues
[ky-size-badge]: https://img.shields.io/bundlephobia/minzip/ky?label=
[ky-size-link]: https://bundlephobia.com/package/ky
[ky-issues-badge]: https://img.shields.io/github/issues/sindresorhus/ky
[ky-issues-link]: https://github.com/sindresorhus/ky/issues
