<h1 align="center">upfetch - advanced fetch client builder</h1>
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

_upfetch_ is an advanced fetch client builder with standard schema validation,
automatic response parsing, smart defaults and more. Designed to make data fetching
type-safe and developer-friendly while keeping the familiar fetch API.

[中文文档 (AI 翻译)](./README_ZH.md)

## Table of Contents

- [Highlights](#️-highlights)
- [Agent Skill](#️-agent-skill)
- [QuickStart](#️-quickstart)
- [Key Features](#️-key-features)
   - [Request Configuration](#️-request-configuration)
   - [Simple Query Parameters](#️-simple-query-parameters)
   - [Automatic Body Handling](#️-automatic-body-handling)
   - [Schema Validation](#️-schema-validation)
   - [Lifecycle Hooks](#️-lifecycle-hooks)
   - [Timeout](#️-timeout)
   - [Retry](#️-retry)
   - [Error Handling](#️-error-handling)
- [Usage](#️-usage)
   - [Authentication](#️-authentication)
   - [Delete a default option](#️-delete-a-default-option)
   - [FormData](#️-formdata)
   - [Multiple fetch clients](#️-multiple-fetch-clients)
   - [Streaming](#️-streaming)
   - [Progress](#️-progress)
    <!-- - [HTTP Agent](#️-http-agent) -->
- [Advanced Usage](#️-advanced-usage)
   - [Error as value](#️-error-as-value)
   - [Custom response parsing](#️-custom-response-parsing)
   - [Custom response errors](#️-custom-response-errors)
   - [Custom params serialization](#️-custom-params-serialization)
   - [Custom body serialization](#️-custom-body-serialization)
   - [Defaults based on the request](#️-defaults-based-on-the-request)
- [API Reference](#️-api-reference)
- [Feature Comparison](#️-feature-comparison)
- [Environment Support](#️-environment-support)

## ➡️ Highlights

- 🚀 **Lightweight** - 1.6kB gzipped, no dependency
- 🔒 **Typesafe** - Validate API responses with [zod][zod], [valibot][valibot] or [arktype][arktype]
- 🛠️ **Practical API** - Use objects for `params` and `body`, get parsed responses automatically
- 🎨 **Flexible Config** - Set defaults like `baseUrl` or `headers` once, use everywhere
- 🎯 **Comprehensive** - Built-in retries, timeouts, progress tracking, streaming, lifecycle hooks, and more
- 🤝 **Familiar** - same API as fetch with additional options and sensible defaults

## ➡️ Agent Skill

Install the `up-fetch` skill with:

```bash
npx skills add L-Blondy/up-fetch
```

## ➡️ QuickStart

```bash
npm i up-fetch
```

Create a new upfetch instance:

```ts
import { up } from 'up-fetch'

export const upfetch = up(fetch)
```

Make a fetch request with schema validation:

```ts
import { upfetch } from './upfetch'
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
   timeout: 30000,
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

Set a timeout for one request:

```ts
upfetch('/todos', {
   timeout: 3000,
})
```

Set a default timeout for all requests:

```ts
const upfetch = up(fetch, () => ({
   timeout: 5000,
}))
```

### ✔️ Retry

The retry functionality allows you to automatically retry failed requests with configurable attempts, delay, and condition.

```ts
const upfetch = up(fetch, () => ({
   retry: {
      attempts: 3,
      delay: 1000,
   },
}))
```

Examples:

<details>
<summary>Per-request retry config</summary>

```ts
await upfetch('/api/data', {
   method: 'DELETE',
   retry: {
      attempts: 2,
   },
})
```

</details>

<details>
<summary>Exponential retry delay</summary>

```ts
const upfetch = up(fetch, () => ({
   retry: {
      attempts: 3,
      delay: (ctx) => ctx.attempt ** 2 * 1000,
   },
}))
```

</details>

<details>
<summary>Retry based on the request method</summary>

```ts
const upfetch = up(fetch, () => ({
   retry: {
      // One retry for GET requests, no retries for other methods:
      attempts: (ctx) => (ctx.request.method === 'GET' ? 1 : 0),
      delay: 1000,
   },
}))
```

</details>

<details>
<summary>Retry based on the response status</summary>

```ts
const upfetch = up(fetch, () => ({
   retry: {
      when({ response }) {
         if (!response) return false
         return [408, 413, 429, 500, 502, 503, 504].includes(response.status)
      },
      attempts: 1,
      delay: 1000,
   },
}))
```

</details>

<details>
<summary>Retry on network errors, timeouts, or any other error</summary>

```ts
const upfetch = up(fetch, () => ({
   retry: {
      attempts: 2,
      delay: 1000,
      when: (ctx) => {
         // Retry on timeout errors
         if (ctx.error) return ctx.error.name === 'TimeoutError'
         // Retry on 429 server errors
         if (ctx.response) return ctx.response.status === 429
         return false
      },
   },
}))
```

</details>

### ✔️ Error Handling

#### 👉 ResponseError

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

- Use the [parseRejected][api-reference] option to throw a custom error instead.
- Use the [reject][api-reference] option to decide **when** to throw.

#### 👉 ResponseValidationError

Raised when schema validation fails. \
Use `isResponseValidationError` to identify this error type.

```ts
import { isResponseValidationError } from 'up-fetch'

try {
   await upfetch('/todos/1', { schema: todoSchema })
} catch (error) {
   if (isResponseValidationError(error)) {
      console.log(error.issues)
   }
}
```

## ➡️ Usage

### ✔️ Authentication

You can easily add authentication to all requests by setting a default header.

Retrieve the token from `localStorage` before each request:

```ts
const upfetch = up(fetch, () => ({
   headers: { Authorization: localStorage.getItem('bearer-token') },
}))
```

Retrieve an async token:

```ts
const upfetch = up(fetch, async () => ({
   headers: { Authorization: await getToken() },
}))
```

### ✔️ Delete a default option

Simply pass `undefined`:

```ts
upfetch('/todos', {
   signal: undefined,
})
```

Also works for single `params` and `headers`:

```ts
upfetch('/todos', {
   headers: { Authorization: undefined },
})
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

### ✔️ Multiple fetch clients

You can create multiple upfetch instances with different defaults:

```ts
const fetchMovie = up(fetch, () => ({
   baseUrl: 'https://api.themoviedb.org',
   headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.API_KEY}`,
   },
}))

const fetchFile = up(fetch, () => ({
   parseResponse: async (res) => {
      const name = res.url.split('/').at(-1) ?? ''
      const type = res.headers.get('content-type') ?? ''
      return new File([await res.blob()], name, { type })
   },
}))
```

### ✔️ Streaming

_upfetch_ provides powerful streaming capabilities through `onRequestStreaming` for upload operations, and `onResponseStreaming` for download operations.

Both handlers receive the following properties:

- `chunk: Uint8Array`: The current chunk of data being streamed
- `transferredBytes: number`: The amount of data transferred so far
- `totalBytes?: number`: The total size of the data, read from the `"Content-Length"` header. \
  For request streaming, if the header is not present, totalBytes are read from the request body.

Here's an example of processing a streamed response from an AI chatbot:

```ts
const decoder = new TextDecoder()

upfetch('/ai-chatbot', {
   onResponseStreaming: ({ chunk }) => {
      const text = decoder.decode(chunk, { stream: true })
      console.log(text)
   },
})
```

### ✔️ Progress

#### 👉 Upload progress:

```ts
upfetch('/upload', {
   method: 'POST',
   body: new File(['large file'], 'foo.txt'),
   onRequestStreaming: ({ transferredBytes, totalBytes }) => {
      console.log(`Progress: ${transferredBytes} / ${totalBytes}`)
   },
})
```

#### 👉 Download progress:

```ts
upfetch('/download', {
   onResponseStreaming: ({
      transferredBytes,
      totalBytes = transferredBytes,
   }) => {
      console.log(`Progress: ${transferredBytes} / ${totalBytes}`)
   },
})
```

## ➡️ Advanced Usage

### ✔️ Error as value

While the Fetch API does not throw an error when the response is not ok, _upfetch_ throws a `ResponseError` instead.

If you'd rather handle errors as values, set `reject` to return `false`. \
This allows you to customize the `parseResponse` function to return both successful data and error responses in a structured format.

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

Usage:

```ts
const { data, error } = await upfetch('/users/1')
```

### ✔️ Custom response parsing

By default _upfetch_ is able to parse `json` and `text` sucessful responses automatically.

The `parseResponse` method is called when `reject` returns `false`.
You can use that option to parse other response types.

```ts
const upfetch = up(fetch, () => ({
   parseResponse: (response) => response.blob(),
}))
```

💡 Note that the `parseResponse` method is called only when `reject` returns `false`.

### ✔️ Custom response errors

By default _upfetch_ throws a `ResponseError` when `reject` returns `true`.

If you want to throw a custom error or customize the error message, you can pass a function to the `parseRejected` option.

```ts
const upfetch = up(fetch, () => ({
   parseRejected: async (response) => {
      const data = await response.json()
      const status = response.status
      // custom error message
      const message = `Request failed with status ${status}: ${JSON.stringify(data)}`
      // you can return a custom error class as well
      return new ResponseError({ message, status, data })
   },
}))
```

### ✔️ Custom params serialization

By default _upfetch_ serializes the params using `URLSearchParams`.

You can customize the params serialization by passing a function to the `serializeParams` option.

```ts
import queryString from 'query-string'

const upfetch = up(fetch, () => ({
   serializeParams: (params) => queryString.stringify(params),
}))
```

### ✔️ Custom body serialization

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

### ✔️ Defaults based on the request

The default options receive the fetcher arguments, this allows you to tailor the defaults based on the actual request.

```ts
const upfetch = up(fetch, (input, options) => ({
   baseUrl: 'https://example.com/',
   // Add authentication only for protected routes
   headers: {
      Authorization:
         typeof input === 'string' && input.startsWith('/api/protected/')
            ? `Bearer ${getToken()}`
            : undefined,
   },
   // Add tracking params only for public endpoints
   params: {
      trackingId:
         typeof input === 'string' && input.startsWith('/public/')
            ? crypto.randomUUID()
            : undefined,
   },
   // Increase timeout for long-running operations
   timeout:
      typeof input === 'string' && input.startsWith('/export/') ? 30000 : 5000,
}))
```

## ➡️ API Reference

### <samp>up(fetch, getDefaultOptions?)</samp>

Creates a new upfetch instance with optional default options.

```ts
function up(
   fetchFn: typeof globalThis.fetch,
   getDefaultOptions?: (
      input: RequestInit,
      options: FetcherOptions,
   ) => DefaultOptions | Promise<DefaultOptions>,
): UpFetch
```

| Option                           | Signature                      | Description                                                                                               |
| -------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `baseUrl`                        | `string`                       | Base URL for all requests.                                                                                |
| `onError`                        | `(error, request) => void`     | Executes on error.                                                                                        |
| `onSuccess`                      | `(data, request) => void`      | Executes when the request successfully completes.                                                         |
| `onRequest`                      | `(request) => void`            | Executes before the request is made.                                                                      |
| `onRequestStreaming`             | `(event, request) => void`     | Executes each time a request chunk is send.                                                               |
| `onResponseStreaming`            | `(event, response) => void`    | Executes each time a response chunk is received.                                                          |
| `onResponse`                     | `(response, request) => void`  | Executes once all retries are completed.                                                                  |
| `onRetry`                        | `(ctx) => void`                | Executes before each retry.                                                                               |
| `params`                         | `object`                       | The default query parameters.                                                                             |
| `parseResponse`                  | `(response, request) => data`  | The default success response parser. <br/>If omitted `json` and `text` response are parsed automatically. |
| `parseRejected`                  | `(response, request) => error` | The default error response parser. <br/>If omitted `json` and `text` response are parsed automatically    |
| `reject`                         | `(response) => boolean`        | Decide when to reject the response.                                                                       |
| `retry`                          | `RetryOptions`                 | The default retry options.                                                                                |
| `serializeBody`                  | `(body) => BodyInit`           | The default body serializer.<br/> Restrict the valid `body` type by typing its first argument.            |
| `serializeParams`                | `(params) => string`           | The default query parameter serializer.                                                                   |
| `timeout`                        | `number`                       | The default timeout in milliseconds.                                                                      |
| _...and all other fetch options_ |                                |                                                                                                           |

### <samp>upfetch(url, options?)</samp>

Makes a fetch request with the given options.

```ts
function upfetch(
   url: string | URL | Request,
   options?: FetcherOptions,
): Promise<any>
```

Options:

| Option                           | Signature                      | Description                                                                                                                   |
| -------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`                        | `string`                       | Base URL for the request.                                                                                                     |
| `onError`                        | `(error, request) => void`     | Executes on error.                                                                                                            |
| `onSuccess`                      | `(data, request) => void`      | Executes when the request successfully completes.                                                                             |
| `onRequest`                      | `(request) => void`            | Executes before the request is made.                                                                                          |
| `onRequestStreaming`             | `(event, request) => void`     | Executes each time a request chunk is send.                                                                                   |
| `onResponseStreaming`            | `(event, response) => void`    | Executes each time a response chunk is received.                                                                              |
| `onResponse`                     | `(response, request) => void`  | Executes once all retries are completed.                                                                                      |
| `onRetry`                        | `(ctx) => void`                | Executes before each retry.                                                                                                   |
| `params`                         | `object`                       | The query parameters.                                                                                                         |
| `parseResponse`                  | `(response, request) => data`  | The success response parser.                                                                                                  |
| `parseRejected`                  | `(response, request) => error` | The error response parser.                                                                                                    |
| `reject`                         | `(response) => boolean`        | Decide when to reject the response.                                                                                           |
| `retry`                          | `RetryOptions`                 | The retry options.                                                                                                            |
| `schema`                         | `StandardSchemaV1`             | The schema to validate the response against.<br/>The schema must follow the [Standard Schema Specification][standard-schema]. |
| `serializeBody`                  | `(body) => BodyInit`           | The body serializer.<br/> Restrict the valid `body` type by typing its first argument.                                        |
| `serializeParams`                | `(params) => string`           | The query parameter serializer.                                                                                               |
| `timeout`                        | `number`                       | The timeout in milliseconds.                                                                                                  |
| _...and all other fetch options_ |                                |                                                                                                                               |

<br/>

### <samp>RetryOptions</samp>

| Option     | Signature            | Description                                                                                  |
| ---------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `when`     | `(ctx) => boolean`   | Function that determines if a retry should happen based on the response or error             |
| `attempts` | `number \| function` | Number of retry attempts or function to determine attempts based on request.                 |
| `delay`    | `number \| function` | Delay between retries in milliseconds or function to determine delay based on attempt number |

<br/>

### <samp>isResponseError(error)</samp>

Checks if the error is a `ResponseError`.

### <samp>isResponseValidationError(error)</samp>

Checks if the error is a `ResponseValidationError`.

### <samp>isJsonifiable(value)</samp>

Determines whether a value can be safely converted to `json`.

Are considered jsonifiable:

- plain objects
- arrays
- class instances with a `toJSON` method

## ➡️ Feature Comparison

Check out the [Feature Comparison][comparison] table to see how _upfetch_ compares to other fetching libraries.

<br/>

## ➡️ Environment Support

- ✅ Browsers (Chrome, Firefox, Safari, Edge)
- ✅ Node.js (18.0+)
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
[bsky-link]: https://bsky.app/intent/compose?text=https%3A%2F%2Fgithub.com%2FL-Blondy%2Fup-fetch
[tweet-badge]: https://img.shields.io/badge/Twitter-0f1419?logo=x&logoColor=fff
[tweet-link]: https://twitter.com/intent/tweet?text=https%3A%2F%2Fgithub.com%2FL-Blondy%2Fup-fetch

<!-- links -->

[zod]: https://zod.dev/
[valibot]: https://valibot.dev/
[arktype]: https://arktype.dev/
[standard-schema]: https://github.com/standard-schema/standard-schema
[standard-schema-libs]: https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec
[api-reference]: #️-api-reference
[comparison]: https://github.com/L-Blondy/up-fetch/blob/master/COMPARISON.md
