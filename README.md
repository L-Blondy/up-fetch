# up-fetch

Tiny & Composable fetch configuration tool with sensible defaults and built-in schema validation.

## ➡️ Highlights

- 🚀 **Lightweight** - 1kB gzipped, no dependency
- 💪 **Safe** - Built-in validation with **[zod][zod]**, **[valibot][valibot]** or **[arktype][arktype]**. _Full list [here][standard-schema-libs]_
- 🤩 **Familiar** - same API as fetch with additional options and sensible defaults
- 🎯 **Intuitive** - define `params` and `body` as plain objects, `Response` parsed out of the box
- 🔥 **Composable** - bring your own validation, serialization and parsing strategies
- 💫 **Reusable** - create instances with custom defaults

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

const data = await upfetch('https://a.b.c/todos/1', {
   schema: z.object({
      id: z.number(),
      title: z.string(),
      completed: z.boolean(),
   }),
})
```

The `json` data is already parsed and properly typed based on the schema.

## ➡️ Key Features

### ✔️ Request Configuration

Set defaults for all requests when creating an instance:

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
}))
```

### ✔️ Simple Query Parameters

👎 With raw fetch:

```ts
fetch(
   `https://api.example.com/todos?search=${search}&skip=${skip}&take=${take}`,
)
```

👍 With _up-fetch_:

```ts
upfetch('/todos', {
   params: { search, skip, take },
})
```

### ✔️ Automatic Body Handling

👎 With raw fetch:

```ts
fetch('https://api.example.com/todos', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ title: 'New Todo' }),
})
```

👍 With _up-fetch_:

```ts
upfetch('/todos', {
   method: 'POST',
   body: { title: 'New Todo' },
})
```

### ✔️ Schema Validation

Since _up-fetch_ follows the [Standard Schema Specification](standard-schema) it can be used with any schema library that implements the spec. \
See the full list [here][standard-schema-libs].

👉 With **zod**

```ts
import { z } from 'zod'

const posts = await upfetch('/posts/1', {
   schema: z.object({
      id: z.number(),
      title: z.string(),
   }),
})
```

👉 With **valibot**

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
   onBeforeFetch: (options) => {
      // ...
   },
   onSuccess: (data, options) => {
      // ...
   },
   onError: (error, options) => {
      // ...
   },
}))
```

### ✔️ Error Handling

By default, _up-fetch_ throws a `ResponseError` when `response.ok` is `false`. The error includes:

- `status`: The HTTP status code
- `data`: The parsed error body
- `options`: The options used for the request
- `response`: The raw Response

```ts
import { isResponseError } from 'up-fetch'

try {
   await upfetch('/todos/1')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.data)
      console.log(error.status)
   }
}
```

## Usage

### ✔️ Timeouts

While _up-fetch_ doesn't provide a timeout option, you can easily implement one using the [AbortSignal.timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout) method:

Set a default timeout for all requests:

```ts
const upfetch = up(fetch, () => ({
   signal: AbortSignal.timeout(5000),
}))
```

Use a different timeout for a specific request:

```ts
upfetch('/todos', {
   signal: AbortSignal.timeout(3000),
})
```

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

### ✔️ HTTP Agent (node only)

Since _up-fetch_ is _"fetch agnostic"_, you can use [undici](https://github.com/nodejs/undici) instead of the native fetch implementation.

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

## ➡️ API Reference

### <samp>up(fetch, getDefaultOptions?)</samp>

Creates a new upfetch instance with optional default options.

```ts
function up(
   fetchFn: typeof globalThis.fetch,
   getDefaultOptions?: () => DefaultOptions,
): UpFetch
```

| Option                           | Signature                      | Description                                       |
| -------------------------------- | ------------------------------ | ------------------------------------------------- |
| `baseUrl`                        | `string`                       | Base URL for all requests.                        |
| `params`                         | `object`                       | The default query parameters.                     |
| `onBeforeFetch`                  | `(options) => void`            | Executes before the request is made.              |
| `onError`                        | `(error, options) => void`     | Executes on error.                                |
| `onSuccess`                      | `(data, options) => void`      | Executes when the request successfully completes. |
| `parseResponse`                  | `(response, options) => data`  | The default success response parser. <br/>If omitted `json` and `text` response are parsed automatically.           |
| `parseResponseError`             | `(response, options) => error` | The default error response parser. <br/>If omitted `json` and `text` response are parsed automatically               |
| `serializeBody`                  | `(body) => BodyInit`           | The default body serializer.                      |
| `serializeParams`                | `(params) => string`           | The default query parameter serializer.           |
| `throwResponseErrorWhen`         | `(response) => boolean`        | Decides if the request should throw an error.     |
| _...and all other fetch options_ |                                |                                                   |

### <samp>upfetch(url, options?)</samp>

Makes a fetch request with the given options.

```ts
function upfetch(
   url: string | URL | Request,
   options?: FetcherOptions | ((defaultOptions: UpOptions) => FetcherOptions),
): Promise<any>
```

Options:

| Option                           | Signature                      | Description                                                                                                                                                      |
| -------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`                        | `string`                       | Base URL for the request.                                                                                                                                        |
| `params`                         | `object`                       | The query parameters.                                                                                                                                            |
| `parseResponse`                  | `(response, options) => data`  | The success response parser.                                                                                                                                     |
| `parseResponseError`             | `(response, options) => error` | The error response parser.                                                                                                                                       |
| `schema`                         | `StandardSchemaV1`             | The schema to validate the response against.<br/>The schema must follow the [Standard Schema Specification](https://github.com/standard-schema/standard-schema). |
| `serializeBody`                  | `(body) => BodyInit`           | The body serializer.                                                                                                                                             |
| `serializeParams`                | `(params) => string`           | The query parameter serializer.                                                                                                                                  |
| `throwResponseErrorWhen`         | `(response) => boolean`        | Decides if the request should throw an error.                                                                                                                    |
| _...and all other fetch options_ |                                |                                                                                                                                                                  |

## ➡️ Environment Support

- ✅ Browsers (Chrome, Firefox, Safari, Edge)
- ✅ Node.js (18+)
- ✅ Deno
- ✅ Cloudflare Workers
- ✅ Vercel Edge Functions

[zod]: https://zod.dev/
[valibot]: https://valibot.dev/
[arktype]: https://arktype.dev/
[standard-schema]: https://github.com/standard-schema/standard-schema
[standard-schema-libs]: https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec
