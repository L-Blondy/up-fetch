# Feature Comparison

_This table aims to provide an accurate comparison of fetch libraries, though there may be room for improvement. If you notice any discrepancies or have additional information to share, please submit a PR with supporting documentation._

## up-fetch vs ofetch vs wretch vs ky vs better-fetch

Legend:

- ✅ Supported
- 🟧 Partially supported
- ❌ Not supported or not documented

| Feature                     | [up-fetch][up-fetch]                           | [ofetch][ofetch]                           | [wretch][wretch]                           | [ky][ky]                           | [better-fetch][better-fetch]                                       |
| --------------------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------ |
| Size                        | [![][up-fetch-size-badge]][up-fetch-size-link] | [![][ofetch-size-badge]][ofetch-size-link] | [![][wretch-size-badge]][wretch-size-link] | [![][ky-size-badge]][ky-size-link] | [![better-fetch][better-fetch-size-badge]][better-fetch-size-link] |
| Automatic Body Handling     | ✅                                             | ✅                                         | ✅                                         | ✅                                 | ✅                                                                 |
| Automatic Params Handling   | ✅                                             | ✅                                         | ✅                                         | ✅                                 | ✅                                                                 |
| Automatic Response Parsing  | ✅                                             | ✅                                         | ✅                                         | ✅                                 | ✅                                                                 |
| Custom Body Serializer      | ✅                                             | 🟧                                         | ❌                                         | ❌                                 | ❌                                                                 |
| Custom Error Parser         | ✅                                             | ❌                                         | 🟧                                         | ❌                                 | ❌                                                                 |
| Custom Error Throwing       | ✅                                             | ❌                                         | ❌                                         | ✅                                 | ✅                                                                 |
| Custom Fetch Implementation | ✅                                             | ❌                                         | ❌                                         | ✅                                 | 🟧                                                                 |
| Custom Params Serializer    | ✅                                             | ❌                                         | ❌                                         | ❌                                 | ❌                                                                 |
| Custom Response Parser      | ✅                                             | ✅                                         | 🟧                                         | 🟧                                 | 🟧                                                                 |
| Dynamic Default Headers     | ✅                                             | 🟧                                         | 🟧                                         | 🟧                                 | 🟧                                                                 |
| Extendable instance         | ❌                                             | ❌                                         | ✅                                         | ✅                                 | ❌                                                                 |
| Hooks/Interceptors          | ✅                                             | ✅                                         | ✅                                         | ✅                                 | ✅                                                                 |
| Instance Configuration      | ✅                                             | ✅                                         | ✅                                         | ✅                                 | ✅                                                                 |
| Retry                       | ❌                                             | ✅                                         | ✅                                         | ✅                                 | ✅                                                                 |
| Schema Validation           | ✅                                             | ❌                                         | ❌                                         | ❌                                 | ✅                                                                 |
| Timeout                     | ✅                                             | ✅                                         | ✅                                         | ✅                                 | ✅                                                                 |
| Zero Dependencies           | ✅                                             | ❌                                         | ✅                                         | ✅                                 | ✅                                                                 |

<!-- libs -->

[ky]: https://github.com/sindresorhus/ky
[better-fetch]: https://github.com/Bekacru/better-fetch
[ofetch]: https://github.com/unjs/ofetch
[wretch]: https://github.com/elbywan/wretch
[up-fetch]: https://github.com/L-Blondy/up-fetch

<!-- badges -->

[up-fetch-size-badge]: https://deno.bundlejs.com/?q=up-fetch&badge
[up-fetch-size-link]: https://bundlejs.com/?q=up-fetch
[ofetch-size-badge]: https://deno.bundlejs.com/?q=ofetch&badge
[ofetch-size-link]: https://bundlejs.com/?q=ofetch
[wretch-size-badge]: https://deno.bundlejs.com/?q=wretch&badge
[wretch-size-link]: https://bundlejs.com/?q=wretch
[ky-size-badge]: https://deno.bundlejs.com/?q=ky&badge
[ky-size-link]: https://bundlejs.com/?q=ky
[better-fetch-size-badge]: https://deno.bundlejs.com/?q=%40better-fetch%2Ffetch&badge
[better-fetch-size-link]: https://bundlejs.com/?q=%40better-fetch%2Ffetch
