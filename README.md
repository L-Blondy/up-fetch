# up-fetch

Tiny [fetch API][MDN] wrapper with configurable defaults.

## ➡️ Highlights

-  🚀 **Lightweight** - 1kB gzipped, no dependency
-  🤩 **Simple** - same syntax as the [fetch API][MDN] with additional options and defaults
-  🎯 **Intuitive** - define the `params` and `body` as plain objects, the `Response` is parsed out of the box
-  🔥 **Adaptive** - bring your own `serialization` and `parsing` strategies for more complex cases
-  💫 **Reusable** - create instances with custom defaults
-  💪 **Strongly typed** - best in class type inferrence and autocomplete
-  👻 **Throws by default** - when `response.ok` is `false`

## ➡️ QuickStart

```bash
npm i up-fetch
```

Create a new upfetch instance

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch)
```

Make a fetch request

```ts
const todos = await upfetch('https://a.b.c', {
   method: 'POST',
   body: { hello: 'world' },
})
```

Since the upfetch options extend the fetch api options, anything that can be done with fetch can also be done with upfetch.

You can set some defaults for all requests

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
   headers: { Authorization: localStorage.getItem('bearer-token') },
}))
```

Since the defaults are evaluated at request time, the `Authorization` header can be defined in `up` by dynamically reading the localStorage/cookies.

```ts
// the baseUrl and Authorization header can be omitted
const todos = await upfetch('/todos', {
   method: 'POST',
   body: { title: 'Hello World' },
   params: { some: 'query params' },
   headers: { 'X-Header': 'Another header' },
   signal: AbortSignal.timeout(5000),
   cache: 'no-store',
})
```

## ➡️ Features

### Set defaults for an upfetch instance

**up-fetch** default behaviour can be entirely customized

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
   headers: { 'X-Header': 'hello world' },
}))
```

See the full [options](#options) list for more details.

### Set the url `params` as object

```ts
// before
fetch(`https://my.url/todos?search=${search}&skip=${skip}&take=${take}`)

// after
upfetch('https://my.url/todos', {
   params: { search, skip, take },
})
```

### `baseUrl` option

Set the baseUrl when you create the instance

```ts
export const upfetch = up(fetch, () => ({
   baseUrl: 'https://my.url',
}))
```

You can then omit it on all requests

```ts
const todos = await upfetch('/todos')
```

### Automatic `Response` parsing

The parsing method is customizable via the [parseResponse](#parseresponse) option

```ts
// before
const response = await fetch('https://my.url/todos')
const todos = await response.json()

// after
const todos = await upfetch('https://my.url/todos')
```

### throws by default

Throws a `ResponseError` when `response.ok` is `false`

A parsed error body is available with `error.data`. \
The raw Response can be accessed with `error.response`. \
The options used make the api call are available with `error.options`.

```ts
import { isResponseError } from 'up-fetch'
import { upfetch } from '...'

try {
   await upfetch('https://my.url/todos')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.data)
      console.log(error.response.status)
   } else {
      console.log('Request error')
   }
}
```

### Set the `body` as object

The `'Content-Type': 'application/json'` header is automatically set when the body is a Jsonifiable object or array. Plain objects, arrays and classes with a `toJSON` method are Jsonifiable.

```ts
// before
fetch('https://my.url/todos', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ post: 'Hello World' }),
})

// after
upfetch('https://my.url/todos', {
   method: 'POST',
   body: { post: 'Hello World' },
})
```

### Interceptors

You can setup the interceptors for all requests

```ts
const upfetch = up(fetch, () => ({
   onBeforeFetch: (options) => console.log('Before fetch'),
   onSuccess: (data, options) => console.log(data),
   onResponseError: (error, options) => console.log(error),
   onRequestError: (error, options) => console.log(error),
}))
```

Or for single requests

```ts
upfetch('/todos', {
   onBeforeFetch: (options) => console.log('Before fetch'),
   onSuccess: (todos, options) => console.log(todos),
   onResponseError: (error, options) => console.log(error),
   onRequestError: (error, options) => console.log(error),
})
```

Learn more [here](#onbeforefetch).

### Timeout

Worth mentionning that **up-fetch** does not provide any `timeout` option since the [AbortSignal.timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) static method is now supported everywhere.

```ts
upfetch('/todos', {
   signal: AbortSignal.timeout(5000),
})
```

## ➡️ Examples

<details><summary><b>Authentication</b></summary><br />

Since the options are evaluated at request time, the Authentication header can be defined when creating the instance

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => {
   const token = localStorage.getItem('token')
   return {
      headers: { Authentication: token ? `Bearer ${token}` : undefined },
   }
})

localStorage.setItem('token', 'abcdef123456')
upfetch('/profile') // Authenticated request

localStorage.removeItem('token')
upfetch('/profile') // Non authenticated request
```

The same approach can be used with `cookies` instead of `localStorage`

</details>

<details><summary><b>Error handling</b></summary><br />

**up-fetch** throws a [ResponseError](#throws-by-default) when `response.ok` is `false`.

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

<details><summary><b>Delete a default option</b></summary><br />

Simply pass `undefined`

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   cache: 'no-store',
   params: { expand: true, count: 1 },
   headers: { Authorization: `Bearer ${token}` },
}))

upfetch('https://a.b.c', {
   cache: undefined, // remove cache
   params: { expand: undefined }, // only remove `expand` from the params
   headers: undefined, // remove all headers
})
```

</details>

<details><summary><b>Override a default option conditionally</b></summary><br />

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

<details><summary><b>Next.js App Router</b></summary><br />

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

<!-- TODO: FormData -->

## ➡️ Types

See the [type definitions](https://github.com/L-Blondy/up-fetch/blob/master/src/types.ts) file for more details

## ➡️ API

All options can be set either on **up** or on an **upfetch** instance except for the [body](#body)

```ts
// set defaults for the instance
const upfetch = up(fetch, () => ({
   baseUrl: 'https://my.url.com',
   cache: 'no-store',
   headers: { Authorization: `Bearer ${token}` },
}))

// override the defaults for a specific call
upfetch('todos', {
   baseUrl: 'https://another.url.com',
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
   baseUrl: 'https://example.com',
}))

// make a GET request to 'https://example.com/id'
upfetch('/id')

// change the baseUrl for a single request
upfetch('/id', { baseUrl: 'https://another-url.com' })
```

<!--  -->

## <samp>\<params\></samp>

**Type:** `{ [key: string]: any }`

The url search params. \
The default params defined in `up` and the `upfetch` instance params are **shallowly merged**. \
Only non-nested objects are supported by default. See the [serializeParams](#serializeparams) option for nested objects.

**Example:**

```ts
const upfetch = up(fetch, () => ({
   params: { expand: true },
}))

// `expand` can be omitted
// the request is sent to: https://example.com/?expand=true&page=2&limit=10
upfetch('https://example.com', {
   params: { page: 2, limit: 10 },
})

// override the `expand` value
// https://example.com/?expand=false&page=2&limit=10
upfetch('https://example.com', {
   params: { page: 2, limit: 10, expand: false },
})

// remove `expand` from the params
// https://example.com/?expand=false&page=2&limit=10
upfetch('https://example.com', {
   params: { page: 2, limit: 10, expand: undefined },
})
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

// https://example.com/todos?a[b]=c
upfetch('https://example.com/todos', {
   params: { a: { b: 'c' } },
})
```

## <samp>\<serializeBody\></samp>

**Type:** `(body: JsonifiableObject | JsonifiableArray) => string`

**Default:** `JSON.stringify`

Customize the [body](#body) serialization into a string. \
The body is passed to `serializeBody` when it is a plain object, an array or a class instance with a `toJSON` method. The other body types remain untouched

**Example:**

```ts
import stringify from 'json-stringify-safe'

// Add support for circular references.
const upfetch = up(fetch, () => ({
   serializeBody: (body) => stringify(body),
}))

upfetch('https://example.com/', {
   body: { now: 'imagine a circular ref' },
})
```

## <samp>\<parseResponse\></samp>

**Type:** `ParseResponse<TData> = (response: Response, options: ComputedOptions) => Promise<TData>`

Customize the fetch response parsing. \
By default `json` and `text` responses are parsed

**Example:**

```ts
// parse a blob
const fetchBlob = up(fetch, () => ({
   parseResponse: (res) => res.blob(),
}))

fetchBlob('https://example.com/')

// disable the default parsing
const upfetch = up(fetch, () => ({
   parseResponse: (res) => res,
}))

const response = await upfetch('https://example.com/')
const data = await response.json()
```

## <samp>\<parseResponseError\></samp>

**Type:** `ParseResponseError<TError> = (response: Response, options: ComputedOptions) => Promise<TError>`

Customize the parsing of a fetch response error (when response.ok is false) \
By default a [ResponseError](#throws-by-default) is created

**Example:**

```ts
const upfetch = up(fetch, () => ({
   parseResponseError: (res) => new CustomResponseError(res),
}))

// using the onResponseError callback
upfetch('https://example.com/', {
   onResponseError(error) {
      // the error is already typed
   },
})

// using try/catch
try {
   await upfetch('https://example.com/')
} catch (error) {
   if (error instanceof CustomResponseError) {
      // handle the error
   } else {
      // Request error
   }
}
```

## <samp>\<onBeforeFetch\></samp>

**Type:** `(options: ComputedOptions) => void`

Called before the [fetch][MDN] call is made.

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onBeforeFetch: (options) => console.log('first'),
}))

upfetch('https://example.com/', {
   onBeforeFetch: (options) => console.log('second'),
})
```

## <samp>\<onSuccess\></samp>

**Type:** `<TData>(data: TData, options: ComputedOptions) => void`

Called when everything went fine

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onSuccess: (data, options) => console.log('first'),
}))

upfetch('https://example.com/', {
   onSuccess: (data, options) => console.log('second'),
})
```

## <samp>\<onResponseError\></samp>

**Type:** `<TResponseError>(error: TResponseError, options: ComputedOptions) => void`

Called when a response error was thrown (response.ok is false). \

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onResponseError: (error, options) => console.log('first'),
}))

upfetch('https://example.com/', {
   onResponseError: (error, options) => console.log('second'),
})
```

## <samp>\<onRequestError\></samp>

**Type:** `(error: Error & Record<string, any>, options: ComputedOptions) => void`

Called when the fetch request fails (no response from the server). \

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onRequestError: (error, options) => console.log('first'),
}))

upfetch('https://example.com/', {
   onRequestError: (error, options) => console.log('second'),
})
```

## ➡️ Compatibility

-  ✅ All modern browsers
-  ✅ Bun
-  ✅ Node 18+
-  ✅ Deno (with the `npm:` specifier)

[MDN]: https://developer.mozilla.org/en-US/docs/Web/API/fetch
