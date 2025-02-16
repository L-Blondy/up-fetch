<h1 align="center">upfetch - advanced fetch client builder for typescript</h1>
<br>
<p align="center">
<img src="https://raw.githubusercontent.com/L-Blondy/up-fetch/refs/heads/master/logos/upfetch-logo-gold.svg" alt="upfetch">
</p>
<br>
<p align="center">
   <a href="https://www.npmjs.com/package/up-fetch"><img src="https://img.shields.io/npm/v/up-fetch.svg?color=EFBA5F" alt="npm version"></a>
   <a href="https://bundlephobia.com/package/up-fetch"><img src="https://img.shields.io/bundlephobia/minzip/up-fetch?color=EFBA5F" alt="npm bundle size"></a>
   <a href="https://github.com/L-Blondy/up-fetch/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/up-fetch.svg?color=EFBA5F" alt="license"></a>
   <a href="https://github.com/L-Blondy/up-fetch/graphs/commit-activity"><img src="https://img.shields.io/github/commit-activity/m/L-Blondy/up-fetch?color=EFBA5F" alt="commit activity"></a>
   <a href="https://www.npmjs.com/package/up-fetch"><img src="https://img.shields.io/npm/dm/up-fetch.svg?color=EFBA5F" alt="downloads per month"></a>
</p>
<br>

_upfetch_ is an advanced fetch client builder with standard schema validation, automatic response parsing, smart defaults and more. Designed to make data fetching type-safe and developer-friendly while keeping the familiar fetch API.

## ➡️ Highlights

- 🚀 **Lightweight** - 1.2kB gzipped, no dependency
- 🔒 **Typesafe** - Validate API responses with [zod][zod], [valibot][valibot] or [arktype][arktype]
- 🛠️ **Practical API** - Use objects for `params` and `body`, get parsed responses automatically
- 🎨 **Flexible Config** - Set defaults like `baseUrl` or `headers` once, use everywhere
- 🤝 **Familiar** - same API as fetch with additional options and sensible defaults

## ➡️ QuickStart

```bash
npm i up-fetch
```

Create a new upfetch instance:

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch)
```

Make a fetch request with schema validation:

```ts
import { z } from 'zod'

const user = await upfetch('https://a.b.c/users/1', {
   schema: z.object({
      id: z.number(),
      name: z.string(),
      avatar: z.string().url(),
   }),
})
```

The response is already **parsed** and properly **typed** based on the schema.

_upfetch_ extends the native fetch API, which means all standard fetch options are available.

## ➡️ Key Features

### ✔️ Request Configuration

Set defaults for all requests when creating an instance:

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
}))
```

Check out the the [API Reference][api-reference] for the full list of options.

### ✔️ Simple Query Parameters

👎 With raw fetch:

```ts
fetch(
   `https://api.example.com/todos?search=${search}&skip=${skip}&take=${take}`,
)
```

👍 With _upfetch_:

```ts
upfetch('/todos', {
   params: { search, skip, take },
})
```

Use the [serializeParams][api-reference] option to customize the query parameter serialization.

### ✔️ Automatic Body Handling

👎 With raw fetch:

```ts
fetch('https://api.example.com/todos', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ title: 'New Todo' }),
})
```

👍 With _upfetch_:

```ts
upfetch('/todos', {
   method: 'POST',
   body: { title: 'New Todo' },
})
```

_upfetch_ also supports all [fetch body types](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#body).

Check out the [serializeBody][api-reference] option to customize the body serialization.

### ✔️ Schema Validation

Since _upfetch_ follows the [Standard Schema Specification][standard-schema] it can be used with any schema library that implements the spec. \
See the full list [here][standard-schema-libs].

👉 With **zod** 3.24+

```ts
import { z } from 'zod'

const posts = await upfetch('/posts/1', {
   schema: z.object({
      id: z.number(),
      title: z.string(),
   }),
})
```

👉 With **valibot** 1.0+

```ts
import { object, string, number } from 'valibot'

const posts = await upfetch('/posts/1', {
   schema: object({
      id: number(),
      title: string(),
   }),
})
```

### ✔️ Lifecycle Hooks

Control request/response lifecycle with simple hooks:

```ts
const upfetch = up(fetch, () => ({
   onRequest: (options) => {
      // Called before the request is made, options might be mutated here
   },
   onSuccess: (data, options) => {
      // Called when the request successfully completes
   },
   onError: (error, options) => {
      // Called when the request fails
   },
}))
```

### ✔️ Timeout

Set a default timeout for all requests:

```ts
const upfetch = up(fetch, () => ({
   timeout: 5000,
}))
```

Use a different timeout for a specific request:

```ts
upfetch('/todos', {
   timeout: 3000,
})
```

### ✔️ Error Handling

#### 👉 <samp>ResponseError</samp>

Raised when `response.ok` is `false`. \
Use `isResponseError` to identify this error type.

```ts
import { isResponseError } from 'up-fetch'

try {
   await upfetch('/todos/1')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.status)
   }
}
```

- Use the [parseResponseError][api-reference] option to throw a custom error instead.
- Use the [throwResponseError][api-reference] option to decide **when** to throw.

#### 👉 <samp>ValidationError</samp>

Raised when schema validation fails. \
Use `isValidationError` to identify this error type.

```ts
import { isValidationError } from 'up-fetch'

try {
   await upfetch('/todos/1', { schema: todoSchema })
} catch (error) {
   if (isValidationError(error)) {
      console.log(error.issues)
   }
}
```

## ➡️ Usage

### ✔️ Authentication

You can easily add authentication to all requests by setting a default header:

```ts
const upfetch = up(fetch, () => ({
   headers: { Authorization: localStorage.getItem('bearer-token') },
}))
```

The bearer token will be retrieved from `localStorage` before each request.

### ✔️ Delete a default option

Simply pass `undefined`:

```ts
upfetch('/todos', (defaultOptions) => ({
   signal: undefined,
}))
```

### ✔️ Override a default option conditionally

You can override default options for a specific request by passing a function as the 2nd argument:

```ts
upfetch('/todos', (defaultOptions) => ({
   signal: condition ? AbortSignal.timeout(5000) : defaultOptions.signal,
}))
```

### ✔️ FormData

Grab the FormData from a `form`.

```ts
const form = document.querySelector('#my-form')

upfetch('/todos', {
   method: 'POST',
   body: new FormData(form),
})
```

Or create FormData from an object:

```ts
import { serialize } from 'object-to-formdata'

const upfetch = up(fetch, () => ({
   serializeBody: (body) => serialize(body),
}))

upfetch('https://a.b.c', {
   method: 'POST',
   body: { file: new File(['foo'], 'foo.txt') },
})
```

### ✔️ HTTP Agent

Since _upfetch_ is _"fetch agnostic"_, you can use [undici](https://github.com/nodejs/undici) instead of the native fetch implementation.

On a single request:

```ts
import { fetch, Agent } from 'undici'

const upfetch = up(fetch)

const data = await upfetch('https://a.b.c', {
   dispatcher: new Agent({
      keepAliveTimeout: 10,
      keepAliveMaxTimeout: 10,
   }),
})
```

On all requests:

```ts
import { fetch, Agent } from 'undici'

const upfetch = up(fetch, () => ({
   dispatcher: new Agent({
      keepAliveTimeout: 10,
      keepAliveMaxTimeout: 10,
   }),
}))
```

### ✔️ Multiple fetch clients

You can create multiple upfetch instances with different defaults:

```ts
const fetchJson = up(fetch)

const fetchBlob = up(fetch, () => ({
   parseResponse: (res) => res.blob(),
}))

const fetchText = up(fetch, () => ({
   parseResponse: (res) => res.text(),
}))
```

## ➡️ Advanced Usage

### Error as value

While the Fetch API does not throw an error when the response is not ok, _upfetch_ throws a `ResponseError` instead.

If you'd rather handle errors as values, set `throwResponseError` to return `false`. \
This allows you to customize the `parseResponse` function to return both successful data and error responses in a structured format.

```ts
const upfetch = up(fetch, () => ({
   throwResponseError: () => false,
   parseResponse: async (response) => {
      const json = await response.json()
      return response.ok
         ? { data: json, error: null }
         : { data: null, error: json }
   },
}))
```

Usage:

```ts
const { data, error } = await upfetch('/users/1')
```

### Custom response parsing

By default _upfetch_ is able to parse `json` and `text` sucessful responses automatically.

The `parseResponse` method is called when `throwResponseError` returns `false`.
You can use that option to parse other response types.

```ts
const upfetch = up(fetch, () => ({
   parseResponse: (response) => response.blob(),
}))
```

💡 Note that the `parseResponse` method is called only when `throwResponseError` returns `false`.

### Custom response errors

By default _upfetch_ throws a `ResponseError` when `throwResponseError` returns `true`.

If you want to throw a custom error instead, you can pass a function to the `parseResponseError` option.

```ts
const upfetch = up(fetch, () => ({
   parseResponseError: async (response) => {
      const status = response.status
      const data = await response.json()
      return new CustomError(status, data)
   },
}))
```

### Custom params serialization

By default _upfetch_ serializes the params using `URLSearchParams`.

You can customize the params serialization by passing a function to the `serializeParams` option.

```ts
import queryString from 'query-string'

const upfetch = up(fetch, () => ({
   serializeParams: (params) => queryString.stringify(params),
}))
```

### Custom body serialization

By default _upfetch_ serializes the plain objects using `JSON.stringify`.

You can customize the body serialization by passing a function to the `serializeBody` option. It lets you:

- **restrict the valid body type** by typing its first argument
- **transform the body** in a valid `BodyInit` type

The following example show how to restrict the valid body type to `Record<string, any>` and serialize it using `JSON.stringify`:

```ts
// Restrict the body type to Record<string, any> and serialize it
const upfetch = up(fetch, () => ({
   serializeBody: (body: Record<string, any>) => JSON.stringify(body),
}))

// ❌ type error: the body is not a Record<string, any>
upfetch('https://a.b.c/todos', {
   method: 'POST',
   body: [['title', 'New Todo']],
})

// ✅ works fine with Record<string, any>
upfetch('https://a.b.c/todos', {
   method: 'POST',
   body: { title: 'New Todo' },
})
```

The following example uses `superjson` to serialize the body. The valid body type is inferred from `SuperJSON.stringify`.

```ts
import SuperJSON from 'superjson'

const upfetch = up(fetch, () => ({
   serializeBody: SuperJSON.stringify,
}))
```

## ➡️ API Reference

### <samp>up(fetch, getDefaultOptions?)</samp>

Creates a new upfetch instance with optional default options.

```ts
function up(
   fetchFn: typeof globalThis.fetch,
   getDefaultOptions?: () => DefaultOptions,
): UpFetch
```

| Option                           | Signature                      | Description                                                                                               |
| -------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `baseUrl`                        | `string`                       | Base URL for all requests.                                                                                |
| `params`                         | `object`                       | The default query parameters.                                                                             |
| `onRequest`                      | `(options) => void`            | Executes before the request is made.                                                                      |
| `onError`                        | `(error, options) => void`     | Executes on error.                                                                                        |
| `onSuccess`                      | `(data, options) => void`      | Executes when the request successfully completes.                                                         |
| `parseResponse`                  | `(response, options) => data`  | The default success response parser. <br/>If omitted `json` and `text` response are parsed automatically. |
| `parseResponseError`             | `(response, options) => error` | The default error response parser. <br/>If omitted `json` and `text` response are parsed automatically    |
| `serializeBody`                  | `(body) => BodyInit`           | The default body serializer.<br/> Restrict the valid `body` type by typing its first argument.            |
| `serializeParams`                | `(params) => string`           | The default query parameter serializer.                                                                   |
| `timeout`                        | `number`                       | The default timeout in milliseconds.                                                                      |
| `throwResponseError`             | `(response) => boolean`        | Decide when to reject the response.                                                                       |
| _...and all other fetch options_ |                                |                                                                                                           |

### <samp>upfetch(url, options?)</samp>

Makes a fetch request with the given options.

```ts
function upfetch(
   url: string | URL | Request,
   options?: FetcherOptions | ((defaultOptions: UpOptions) => FetcherOptions),
): Promise<any>
```

Options:

| Option                           | Signature                      | Description                                                                                                                   |
| -------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`                        | `string`                       | Base URL for the request.                                                                                                     |
| `params`                         | `object`                       | The query parameters.                                                                                                         |
| `parseResponse`                  | `(response, options) => data`  | The success response parser.                                                                                                  |
| `parseResponseError`             | `(response, options) => error` | The error response parser.                                                                                                    |
| `schema`                         | `StandardSchemaV1`             | The schema to validate the response against.<br/>The schema must follow the [Standard Schema Specification][standard-schema]. |
| `serializeBody`                  | `(body) => BodyInit`           | The body serializer.<br/> Restrict the valid `body` type by typing its first argument.                                        |
| `serializeParams`                | `(params) => string`           | The query parameter serializer.                                                                                               |
| `timeout`                        | `number`                       | The timeout in milliseconds.                                                                                                  |
| `throwResponseError`             | `(response) => boolean`        | Decide when to reject the response.                                                                                           |
| _...and all other fetch options_ |                                |                                                                                                                               |

<br/>

## Feature Comparison

Check out the [Feature Comparison][comparison] table to see how _upfetch_ compares to other fetch libraries.

<br/>

## ➡️ Environment Support

- ✅ Browsers (Chrome, Firefox, Safari, Edge)
- ✅ Node.js (20.3.0+)
- ✅ Bun
- ✅ Deno
- ✅ Cloudflare Workers
- ✅ Vercel Edge Runtime

<div align="center">
<br />
<br />
<hr/>
<h3>Share on:</h3>

[![s][bsky-badge]][bsky-link]
[![Share on Twitter][tweet-badge]][tweet-link]

<br />
<br />
</div >

<!-- Badges -->

[bsky-badge]: https://img.shields.io/badge/Bluesky-0085ff?logo=bluesky&logoColor=fff
[bsky-link]: https://bsky.app/intent/compose?text=up-fetch%0A%0ATiny%20%26%20Composable%20fetch%20configuration%20tool%20with%20sensible%20defaults%20and%20built-in%20schema%20validation%0A%0Ahttps://github.com/L-Blondy/up-fetch
[tweet-badge]: https://img.shields.io/badge/Twitter-0f1419?logo=x&logoColor=fff
[tweet-link]: https://twitter.com/intent/tweet?text=up-fetch%0A%0ATiny%20%26%20Composable%20fetch%20configuration%20tool%20with%20sensible%20defaults%20and%20built-in%20schema%20validation%0A%0Ahttps://github.com/L-Blondy/up-fetch

<!-- links -->

[zod]: https://zod.dev/
[valibot]: https://valibot.dev/
[arktype]: https://arktype.dev/
[standard-schema]: https://github.com/standard-schema/standard-schema
[standard-schema-libs]: https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec
[api-reference]: #️-api-reference
[comparison]: https://github.com/L-Blondy/up-fetch/blob/master/COMPARISON.md
