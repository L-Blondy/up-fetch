# up-fetch

**up-fetch** is a tiny 1kb configuration tool for the fetch API with sensible default.

_Go to the [Chinese docs](https://github.com/L-Blondy/up-fetch/blob/master/README_ZH.md)_

## ➡️ Highlights

-  🚀 **Lightweight** - 1kB gzipped, no dependency
-  🤩 **Simple** - same syntax as the [fetch API][MDN] with additional options and defaults
-  🎯 **Intuitive** - define the `params` and `body` as plain objects, the `Response` is parsed out of the box
-  🔥 **Adaptive** - bring your own `serialization` and `parsing` strategies for more complex cases
-  💫 **Reusable** - create instances with custom defaults
-  💪 **Strongly typed** - best in class type inferrence and autocomplete
-  🤯 **Validation adapters** - _(opt-in)_ validate the data for maximum type safety with [zod](https://zod.dev/) or [valibot](https://valibot.dev/)
-  👻 **Throws by default** - when `response.ok` is `false`
-  📦 **Tree Shakable** - You only get what you use

## ➡️ QuickStart

```bash
npm i up-fetch # or bun i up-fetch
```

Create a new upfetch instance

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch)
```

Make a fetch request

```ts
const todo = await upfetch('https://a.b.c', {
   method: 'POST',
   body: { hello: 'world' },
})
```

You can set some defaults for all requests. \
The defaults are dynamic, they are **evaluated before each request**, great for handling authentication.

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
   headers: { Authorization: localStorage.getItem('bearer-token') },
}))
```

Since **`up` extends the provided fetch API options**, anything that can be done with fetch can also be done with upfetch.

```ts
// the baseUrl and Authorization header can be omitted
const todo = await upfetch('/todos', {
   method: 'POST',
   body: { title: 'Hello World' },
   params: { some: 'query params' },
   headers: { 'X-Header': 'Another header' },
   signal: AbortSignal.timeout(5000),
   keepalive: true,
   cache: 'no-store',
})
```

Any fetch API implementation can be used, like [undici](https://github.com/nodejs/undici) or [node-fetch](https://github.com/node-fetch/node-fetch)

```ts
import { fetch } from 'undici'

const upfetch = up(fetch)
```

### Raw fetch vs upfetch

#### fetch that throws when response.ok is false:

You should first create a custom ResponseError class that extends the built in Error class in order to expose the response and the parsed response data.

A naive implementation might look like this

```ts
export class ResponseError extends Error {
   constructor(response, data) {
      super(`Request failed with status ${res.status}`)
      this.data = data
      this.name = 'ResponseError'
      this.response = response
      // don't need to expose the status at the top level,
      // it will be available with `error.response.status`
   }
}
```

Then proceed with the definition of the fetcher itself. The following is a simplified example

```ts
const fetchTodos = async ({ search, take, skip }) => {
   const response = await fetch(
      `https://a.b.c/?search=${search}&skip=${skip}&take=${take}`,
   )
   const data = await response.json()
   if (response.ok) {
      return data
   }
   throw new ResponseError(response, data)
}
```

#### Same example using **up-fetch**:

Granted that you've already created an `up(fetch)` instance the previous example can be written like this:

```ts
const fetchData = (params) => upfetch('https://a.b.c', { params })
```

## ➡️ Features

### ✔️ Set defaults for an upfetch instance

**up-fetch** default behaviour can be entirely customized

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
   headers: { 'X-Header': 'hello world' },
}))
```

See the full [options](#%EF%B8%8F-api) list for more details.

### ✔️ Set the url `params` as object

```ts
// before
fetch(`https://a.b.c/?search=${search}&skip=${skip}&take=${take}`)

// after
upfetch('https://a.b.c', {
   params: { search, skip, take },
})
```

### ✔️ `baseUrl` option

Set the baseUrl when you create the instance

```ts
export const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
}))
```

You can then omit it on all requests

```ts
const todos = await upfetch('/todos')
```

### ✔️ Automatic `Response` parsing

The parsing method is customizable via the [parseResponse](#parseresponse) option

```ts
// before
const response = await fetch('https://a.b.c')
const todos = await response.json()

// after
const todos = await upfetch('https://a.b.c')
```

### ✔️ throws by default

Throws a `ResponseError` when `response.ok` is `false`

A parsed error body is available with `error.data`. \
The raw Response can be accessed with `error.response`. \
The options used make the api call are available with `error.options`.

```ts
import { isResponseError } from 'up-fetch'
import { upfetch } from '...'

try {
   await upfetch('https://a.b.c')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.data)
      console.log(error.response.status)
   } else {
      console.log('Request error')
   }
}
```

### ✔️ Set the `body` as object

The `'Content-Type': 'application/json'` header is automatically set when the body is a Jsonifiable object or array. Plain objects, arrays and classes with a `toJSON` method are Jsonifiable.

```ts
// before
fetch('https://a.b.c', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ post: 'Hello World' }),
})

// after
upfetch('https://a.b.c', {
   method: 'POST',
   body: { post: 'Hello World' },
})
```

### ✔️ Data Validation

**up-fetch** has built-in adapters for [zod](https://zod.dev/) and [valibot](https://valibot.dev/)

First install either `zod` or `valibot`...

```bash
npm i zod
# or
npm i valibot
```

...then validate the data with the built-in _tree shakeable_ helpers.

**zod example:**

```ts
import { z } from 'zod'
import { withZod } from 'up-fetch/with-zod'

// ...create or import your upfetch instance

const todo = await upfetch('/todo/1', {
   parseResponse: withZod(
      z.object({
         id: z.number(),
         title: z.string(),
         description: z.string(),
         createdOn: z.string(),
      }),
   ),
})
// the type of todo is { id: number, title: string, description: string, createdOn: string}
```

**valibot example:**

```ts
import { object, string, number } from 'zod'
import { withValibot } from 'up-fetch/with-valibot'

// ...create or import your upfetch instance

const todo = await upfetch('/todo/1', {
   parseResponse: withValibot(
      object({
         id: number(),
         title: string(),
         description: string(),
         createdOn: string(),
      }),
   ),
})
// the type of todo is { id: number, title: string, description: string, createdOn: string}
```

In case of error the adapters will throw. You can listen to these errors with the [onParsingError](#onparsingerror) option.
The adapters can also be used on `parseResponseError`

### ✔️ Interceptors

You can setup the interceptors for all requests

```ts
const upfetch = up(fetch, () => ({
   onBeforeFetch: (options) => console.log('Before fetch'),
   onSuccess: (data, options) => console.log(data),
   onResponseError: (error, options) => console.log(error),
   onRequestError: (error, options) => console.log(error),
   onParsingError: (error, options) => console.log(error),
}))
```

Or for single requests

```ts
upfetch('/todos', {
   onBeforeFetch: (options) => console.log('Before fetch'),
   onSuccess: (todos, options) => console.log(todos),
   onResponseError: (error, options) => console.log(error),
   onRequestError: (error, options) => console.log(error),
   onParsingError: (error, options) => console.log(error),
})
```

Learn more [here](#onbeforefetch).

### ✔️ Timeout

Worth mentionning that while **up-fetch** does not provide any `timeout` option since the [AbortSignal.timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) static method is now supported everywhere, you can still leverage **up-fetch** to apply a default timeout.

_Set a default `timeout` for all requests:_

```ts
const upfetch = up(fetch, () => ({
   signal: AbortSignal.timeout(5000),
}))
```

_Use a different `timeout` for a specific request:_

```ts
upfetch('/todos', {
   signal: AbortSignal.timeout(3000),
})
```

## ➡️ How to

<details><summary>💡 handle <b>Authentication</b></summary><br />

Since the defaults are evaluated at request time, the Authentication header can be defined in `up`

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   headers: { Authentication: localStorage.getItem('bearer-token') },
}))

localStorage.setItem('bearer-token', 'Bearer abcdef123456')
upfetch('/profile') // Authenticated request

localStorage.removeItem('bearer-token')
upfetch('/profile') // Non authenticated request
```

```ts
// ❌ Don't read the storage / cookies outside of `up`

// This value will never change
const bearerToken = localStorage.getItem('bearer-token')

const upfetch = up(fetch, () => ({
   headers: { Authentication: bearerToken },
}))
```

```ts
// ✅ Keep it inside the function call

// Checks the localStorage on each request
const upfetch = up(fetch, () => ({
   headers: { Authentication: localStorage.getItem('bearer-token') },
}))
```

The same approach can be used with `cookies`

</details>

<details><summary>💡 handle <b>errors</b></summary><br />

**up-fetch** throws a [ResponseError](#%EF%B8%8F-throws-by-default) when `response.ok` is `false`.

The parsed response body is available with `error.data`. \
The response status is available with `error.response.status`. \
The options used the make the request are available with `error.options`.

The [type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types) `isResponseError` can be used to check if the error is a `ResponseError`

```ts
import { upfetch } from '...'
import { isResponseError } from 'up-fetch'

// with try/catch
try {
   return await upfetch('https://a.b.c')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.name)
      console.log(error.message)
      console.log(error.data)
      console.log(error.response.status)
      console.log(error.options)
   } else {
      console.log(error.name)
      console.log(error.message)
   }
}

// with Promise.catch
upfetch('https://a.b.c').catch((error) => {
   if (isResponseError(error)) {
      console.log(error.name)
      console.log(error.message)
      console.log(error.data)
      console.log(error.response.status)
      console.log(error.options)
   } else {
      console.log(error.name)
      console.log(error.message)
   }
})
```

**up-fetch** also exports some listeners, useful for logging

```ts
import { up } from 'up-fetch'
import { log } from './my-logging-service'

const upfetch = up(fetch, () => ({
   onResponseError(error) {
      log.responseError(error)
   },
   onRequestError(error) {
      log.requestError(error)
   },
}))

upfetch('/fail-to-fetch')
```

</details>

<details><summary>💡 <b>Delete</b> a default option</summary><br />

Simply pass `undefined`

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   cache: 'no-store',
   params: { expand: true, count: 1 },
   headers: { Authorization: localStorage.getItem('bearer-token') },
}))

upfetch('https://a.b.c', {
   cache: undefined, // remove cache
   params: { expand: undefined }, // only remove `expand` from the params
   headers: undefined, // remove all headers
})
```

</details>

<details><summary>💡 <b>Override</b> a default option conditionally</summary><br />

You may sometimes need to conditionally override the default options provided in `up`. Javascript makes it a bit tricky:

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   headers: { 'X-Header': 'value' }
}))

❌ Don't
// if `condition` is false, the header will be deleted
upfetch('https://a.b.c', {
   headers: { 'X-Header': condition ? 'newValue' : undefined }
})
```

In order to solve this problem, upfetch exposes the `upOptions` when the options (2nd arg) are defined as a function. \
`upOptions` are stricly typed (const generic)

```ts
✅ Do
upfetch('https://a.b.c', (upOptions) => ({
   headers: { 'X-Header': condition ? 'newValue' : upOptions.headers['X-Header'] }
}))
```

</details>

<details><summary>💡 use with <b>Next.js</b> App Router</summary><br />

Since **up-fetch** extends the fetch API, **Next.js** specific [fetch options](https://nextjs.org/docs/app/api-reference/functions/fetch) also work with **up-fetch**.

_Choose a default caching strategy_

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   next: { revalidate: false },
}))
```

_Override it for a specific request_

```ts
upfetch('/posts', {
   next: { revalidate: 60 },
})
```

</details>

## ➡️ Adapters

<details><summary>💡 <b>zod</b> validation</summary>💡</details>

<details><summary>💡 <b>valibot</b> validation</summary>💡</details>

<details><summary>💡 <b>FormData</b> serialization</summary>💡</details>

<details><summary>💡 <b>progress</b> (upload / download)</summary>🔗</details>

<details><summary>💡 <b>HTTP Agent</b> (node only)</summary><br />

_April 2024_

Node, bun and browsers implementation of the fetch API do not support HTTP agents.

In order to use http agents you'll have to use [undici](https://github.com/nodejs/undici) (node only)

_Add an HTTP Agent on a single request_

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

_Dynamically add an HTTP Agent on each request request_

```ts
import { fetch, Agent } from 'undici'

const upfetch = up(fetch, () => ({
   dispatcher: new Agent({
      keepAliveTimeout: 10,
      keepAliveMaxTimeout: 10,
   }),
}))

const data = await upfetch('https://a.b.c')
```

</details>

## ➡️ Types

See the [type definitions](https://github.com/L-Blondy/up-fetch/blob/master/src/types.ts) file for more details

## ➡️ Options

All options can be set either on **up** or on an **upfetch** instance except for the [body](#body)

```ts
// set defaults for the instance
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
   cache: 'no-store',
   headers: { Authorization: `Bearer ${token}` },
}))

// override the defaults for a specific call
upfetch('/todos', {
   baseUrl: 'https://x.y.z',
   cache: 'force-cache',
})
```

**upfetch** adds the following options to the [fetch API][MDN].

<!--  -->

## <samp>\<baseUrl\></samp>

**Type:** `string`

Sets the base url for the requests

**Example:**

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
}))

// make a GET request to 'https://a.b.c/id'
upfetch('/id')

// change the baseUrl for a single request
upfetch('/id', { baseUrl: 'https://x.y.z' })
```

<!--  -->

## <samp>\<params\></samp>

**Type:** `{ [key: string]: any }`

The url search params. \
The params defined in `up` and the params defined in `upfetch` are **shallowly merged**. \
Only non-nested objects are supported by default. See the [serializeParams](#serializeparams) option for nested objects.

**Example:**

```ts
const upfetch = up(fetch, () => ({
   params: { expand: true },
}))

// `expand` can be omitted
// ?expand=true&page=2&limit=10
upfetch('https://a.b.c', {
   params: { page: 2, limit: 10 },
})

// override the `expand` param
// ?expand=false&page=2&limit=10
upfetch('https://a.b.c', {
   params: { page: 2, limit: 10, expand: false },
})

// delete `expand` param
// ?expand=false&page=2&limit=10
upfetch('https://a.b.c', {
   params: { expand: undefined },
})

// conditionally override the expand param `expand` param
// ?expand=false&page=2&limit=10
upfetch('https://a.b.c', (upOptions) => ({
   params: { expand: isTruthy ? true : upOptions.params.expand },
}))
```

<!--  -->

## <samp>\<headers\></samp>

**Type:** `HeadersInit | Record<string, string | number | null | undefined>`

Same as the fetch API headers with widened types. \
The headers defined in `up` and the headers defined in `upfetch` are **shallowly merged**. \

**Example:**

```ts
const upfetch = up(fetch, () => ({
   headers: { Authorization: 'Bearer ...' },
}))

// the request will have both the `Authorization` and the `Test-Header` headers
upfetch('https://a.b.c', {
   headers: { 'Test-Header': 'test value' },
})

// override the `Authorization` header
upfetch('https://a.b.c', {
   headers: { Authorization: 'Bearer ...2' },
})

// delete the `Authorization` header
upfetch('https://a.b.c', {
   headers: { Authorization: null }, // undefined also works
})

// conditionally override the `Authorization` header
upfetch('https://a.b.c', (upOptions) => ({
   headers: {
      Authorization: isTruthy ? 'Bearer ...3' : upOptions.headers.val,
   },
}))
```

<!--  -->

## <samp>\<body\></samp>

**Type:** `BodyInit | JsonifiableObject | JsonifiableArray | null`

Note that this option is not available on **up**

The body of the request.\
Can be pretty much anything. \
See the [serializeBody](#serializebody) for more details.

**Example:**

```ts
upfetch('/todos', {
   method: 'POST',
   body: { hello: 'world' },
})
```

<!--  -->

## <samp>\<serializeParams\></samp>

**Type:** `(params: { [key: string]: any } ) => string`

Customize the [params](#params) serialization into a query string. \
The default implementation only supports **non-nested objects**.

**Example:**

```ts
import qs from 'qs'

// add support for nested objects using the 'qs' library
const upfetch = up(fetch, () => ({
   serializeParams: (params) => qs.stringify(params),
}))

// ?a[b]=c
upfetch('https://a.b.c', {
   params: { a: { b: 'c' } },
})
```

## <samp>\<serializeBody\></samp>

**Type:** `(body: JsonifiableObject | JsonifiableArray) => BodyInit | null | undefined`

**Default:** `JSON.stringify`

Customize the [body](#body) serialization into a valid `BodyInit`, a `string` in most cases\
The body is passed to `serializeBody` when it is a plain object, an array or a class instance with a `toJSON` method. The other body types remain untouched

**Example: serialize `objects` to `FormData` using [object-to-formdata](https://github.com/therealparmesh/object-to-formdata) (<1kb)**

_Note: when sending FormData the headers are added automatically. See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects#sect4) docs_

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

## <samp>\<parseResponse\></samp>

**Type:** `ParseResponse<TData> = (response: Response, options: ComputedOptions) => Promise<TData>`

Customize the fetch response parsing. \
By default `json` and `text` responses are parsed

This option is best used with a [validation adapter](#%EF%B8%8F-data-validation)

**Example:**

```ts
// create a fetcher for blobs
const fetchBlob = up(fetch, () => ({
   parseResponse: (res) => res.blob(),
}))

// disable the default parsing
const upfetch = up(fetch, () => ({
   parseResponse: (res) => res,
}))
```

**With a validation adapter:**

```ts
import { z } from 'zod'
import { withZod } from 'up-fetch/with-zod'

// ...create or import your upfetch instance

const todo = await upfetch('/todo/1', {
   parseResponse: withZod(
      z.object({
         id: z.number(),
         title: z.string(),
         description: z.string(),
         createdOn: z.string(),
      }),
   ),
})
```

## <samp>\<parseResponseError\></samp>

**Type:** `ParseResponseError<TError> = (response: Response, options: ComputedOptions) => Promise<TError>`

Customize the parsing of a fetch response error (when response.ok is false) \
By default a [ResponseError](#%EF%B8%8F-throws-by-default) is thrown

**Example:**

```ts
// throw a `CustomResponseError` when `response.ok` is `false`
const upfetch = up(fetch, () => ({
   parseResponseError: (res) => new CustomResponseError(res),
}))
```

`parseResponse` can also be used with a [validation adapter](#%EF%B8%8F-data-validation)

## <samp>\<onSuccess\></samp>

**Type:** `<TData>(data: TData, options: ComputedOptions) => void`

Called when `response.ok` is `true`

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onSuccess: (data, options) => console.log('2nd'),
}))

upfetch('https://a.b.c', {
   onSuccess: (data, options) => console.log('1st'),
})
```

## <samp>\<onResponseError\></samp>

**Type:** `<TResponseError>(error: TResponseError, options: ComputedOptions) => void`

Called when a response error was thrown (`response.ok` is `false`).

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onResponseError: (error, options) => console.log('Response error', error),
}))

upfetch('https://a.b.c', {
   onResponseError: (error, options) => console.log('Response error', error),
})
```

## <samp>\<onRequestError\></samp>

**Type:** `(error: Error, options: ComputedOptions) => void`

Called when the fetch request fails (no response from the server).

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onRequestError: (error, options) => console.log('Request error', error),
}))

upfetch('https://a.b.c', {
   onRequestError: (error, options) => console.log('Request error', error),
})
```

## <samp>\<onParsingError\></samp>

**Type:** `(error: any, options: ComputedOptions) => void`

Called when either `parseResponse` or `parseResponseError` throw. \
Usefull when using a [validation adapter](#%EF%B8%8F-data-validation)

**Example:**

```ts
import { z } from 'zod'
import { withZod } from 'up-fetch/with-zod'

const upfetch = up(fetch, () => ({
   onParsingError: (error, options) => console.log('Validation error', error),
}))

upfetch('https://a.b.c', {
   onParsingError: (error, options) => console.log('Validation error', error),
   parseResponse: withZod(
      z.object({
         id: z.number(),
         title: z.string(),
         description: z.string(),
         createdOn: z.string(),
      }),
   ),
})
```

## <samp>\<onBeforeFetch\></samp>

**Type:** `(options: ComputedOptions) => void`

Called before the request is sent.

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onBeforeFetch: (options) => console.log('2nd'),
}))

upfetch('https://a.b.c', {
   onBeforeFetch: (options) => console.log('1st'),
})
```

## ➡️ Compatibility

-  ✅ All modern browsers
-  ✅ Bun
-  ✅ Node 18+

[MDN]: https://developer.mozilla.org/en-US/docs/Web/API/fetch

## From the same author

-  [tw-colors](https://github.com/L-Blondy/tw-colors): Tailwind plugin to easily add multiple color themes to your projects.
