# up-fetch 

Tiny [fetch API][MDN] wrapper with configurable defaults

# Highlights

* **Lightweight** - 1kB gzipped
* **Simple** - same syntax as the [fetch API][MDN] with additional options and defaults
* **Intuitive** - define the `params` and `body` as plain objects, the `Response` is parsed out of the box 
* **Adaptive** - bring your own `serialization` and `parsing` strategies for more complex cases
* **Reusable** - create instances with custom defaults
* **Strongly typed** - best in class type inferrence and autocomplete
* **Throws by default** - when `response.ok` is `false`

# QuickStart

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
const todos = await upfetch('https://my.url/todos', {
   params: { search: 'Hello world' },
})
```

Since the upfetch options extend the fetch api options, ***anything that can be done with fetch can also be done with upfetch***.

# Features

### Set defaults for an upfetch instance

**up-fetch** default behaviour can be entirely customized

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c', 
   headers: { 'X-Header': 'hello world' }
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
   baseUrl: 'https://my.url'
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
} 
catch(error){
   if(isResponseError(error)){
      console.log(error.data)
      console.log(error.response.status)
   } else {
      console.log('unknown error')
   }
}
```

### Set the `body` as object

The `'Content-Type': 'application/json'` header is automatically set when the body is a Jsonifiable object or array. Plain objects, arrays and classes with a `toJSON` method are Jsonifiable. 

```ts
// before
fetch('https://my.url/todos', {
   method: 'POST',
   headers: {'Content-Type': 'application/json'},
   body: JSON.stringify({ post: 'Hello World'})
})

// after
upfetch('https://my.url/todos', {
   method: 'POST',
   body: { post: 'Hello World'}
})
``` 

# Examples

<details><summary><b>Authentication</b></summary>

Since the options are evaluated at request time, the Authentication header can be defined when creating the instance

```ts
import { up } from 'up-fetch' 

const upfetch = up(fetch, () => {
   const token = localStorage.getItem('token')
   return {
      headers: { Authentication: token ? `Bearer ${token}` : undefined }
   }
})

localStorage.setItem('token', 'abcdef123456')
upfetch('/profile') // Authenticated request

localStorage.removeItem('token')
upfetch('/profile') // Non authenticated request
```

The same approach can be used with `cookies` instead of `localStorage`
</details>

<details><summary><b>Error handling</b></summary>

Two types of error can occur:
1. a response error when the server responds with an error code (`response.ok` is `false`)
2. an unknown error when the server did not respond (failed to fetch, runtime error, etc)

By default response errors throw a [ResponseError](#throws-by-default) 
Otherwise, the errors are thrown "as is"

**up-fetch** provides a [type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types) to check if the error is a `ResponseError`

```ts
import { upfetch } from '...'
import { isResponseError } from 'up-fetch'

// with try/catch
try {
   return await upfetch('https://a.b.c')
}
catch(error){
   if(isResponseError(error)) {
      // The server responded, the parsed data is available on the ReponseError
      console.log(error.data) 
   }
   else {
      console.log(error.message)
   }
}

// with Promise.catch
upfetch('https://a.b.c')
   .catch((error) => {
      if(isResponseError(error)) {
         // The server responded, the parsed data is available on the ReponseError
         console.log(error.data) 
      }
      else {
         console.log(error.message)
      }
   })
```

**up-fetch** also exports some listeners, useful for logging

```ts
import { up } from 'up-fetch' 
import { log } from './my-logging-service'

const upfetch = up(fetch, () => ({
   onResponseError(error){
      // error is of type ResponseError
      log.responseError(error)
   },
   onUnknownError(error){
      log.unknownError(error)
   },
   onError(error){
      // the error can either be a ResponseError or an unknown error
      log.error(error)
   },
}))

upfetch('/fail-to-fetch')
```
</details>

<details><summary><b>Delete a default option</b></summary>

Simply pass `undefined`

```ts
import { up } from 'up-fetch' 

const upfetch = up(fetch, () => ({
   cache: 'no-store',
   params: { expand: true, count: 1 },
   headers: { Authorization: `Bearer ${token}` }
}))

upfetch('https://a.b.c', {
   cache: undefined, // remove cache
   params: { expand: undefined }, // only remove `expand` from the params
   headers: undefined // remove all headers
})
```
</details>

<details><summary><b>Override a default option conditionally</b></summary>

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

<!-- TODO: FormData -->

# Types

See the [type definitions](https://github.com/L-Blondy/up-fetch/blob/master/src/types.ts) file for more details

# API

All options can be set either on **up** or on an **upfetch** instance except for the [body](#body)

```ts
// set defaults for the instance
const upfetch = up(fetch, () => ({
   baseUrl: 'https://my.url.com',
   cache: 'no-store',
   headers: { 'Authorization': `Bearer ${token}` }
}))

// override the defaults for a specific call
upfetch('todos', {
   baseUrl: 'https://another.url.com',
   cache: 'force-cache'
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
   baseUrl: 'https://example.com' 
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
   params : { expand: true  }
}))

// `expand` can be omitted
// the request is sent to: https://example.com/?expand=true&page=2&limit=10
upfetch('https://example.com', { 
   params: { page: 2, limit: 10 }
})

// override the `expand` value
// https://example.com/?expand=false&page=2&limit=10
upfetch('https://example.com', { 
   params: { page: 2, limit: 10, expand: false }
})

// remove `expand` from the params
// https://example.com/?expand=false&page=2&limit=10
upfetch('https://example.com', { 
   params: { page: 2, limit: 10, expand: undefined }
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
   body: { hello: 'world' } 
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
   serializeParams: (params) => qs.stringify(params)
}))

// https://example.com/todos?a[b]=c
upfetch('https://example.com/todos', { 
   params: { a: { b: 'c' } }
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
   serializeBody: (body) => stringify(body)
}))

upfetch('https://example.com/', { 
   body: { now: 'imagine a circular ref' }
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
   parseResponse: (res) => res.blob()
}))

fetchBlob('https://example.com/')

// disable the default parsing
const upfetch = up(fetch, () => ({
   parseResponse: (res) => res
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
   parseResponseError: (res) => new CustomResponseError(res)
}))

// using the onResponseError callback
upfetch('https://example.com/', {
   onResponseError(error){
      // the error is already typed
   }
})

// using try/catch
try {
   await upfetch('https://example.com/')
}
catch(error){
   if(error instanceof CustomResponseError){
      // handle the error
   }
   else {
      // unknown error (no response from the server)
   }
}
```


## <samp>\<parseUnknownError\></samp>

**Type:** `ParseUnknownError<TError> = (error: any, options: ComputedOptions) => TError`

Customize the parsing of an unknown fetch error (eg. when the server did not respond) 

**Example:**

```ts
// extract the error.message for all unknown errors
const upfetch = up(fetch, () => ({
   parseUnknownError: (error) => error.message
}))

// using the onUnknwonError callback
upfetch('https://example.com/', {
   onUnknownError(error){
      // the error is already typed as a string
   }
})

// using try/catch
try {
   await upfetch('https://example.com/')
}
catch(error){
   if(isResponseError(error)){
      // response error
   }
   else {
      // unknown error
   }
}
```


## <samp>\<onBeforeFetch\></samp>

**Type:** `(options: ComputedOptions) => void`

Called before the [fetch][MDN] call is made. 

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onBeforeFetch: (options) => console.log('first')
}))

upfetch('https://example.com/', {
   onBeforeFetch: (options) => console.log('second')
})
```

## <samp>\<onSuccess\></samp>

**Type:** `<TData>(data: TData, options: ComputedOptions) => void`

Called when everything went fine

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onSuccess: (data, options) => console.log('first')
}))

upfetch('https://example.com/', {
   onSuccess: (data, options) => console.log('second')
})
```

## <samp>\<onResponseError\></samp>

**Type:** `<TResponseError>(error: TResponseError, options: ComputedOptions) => void`

Called when a response error was thrown (response.ok is false), before [onError](#onerror)

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onResponseError: (error, options) => console.log('first')
}))

upfetch('https://example.com/', {
   onResponseError: (error, options) => console.log('second')
})
```

## <samp>\<onUnknownError\></samp>

**Type:** `<TUnknownError>(error: TUnknownError, options: ComputedOptions) => void`

Called when an unknown error was thrown (an error that is not a response error), before [onError](#onerror)

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onUnknownError: (error, options) => console.log('first')
}))

upfetch('https://example.com/', {
   onUnknownError: (error, options) => console.log('second')
})
```

## <samp>\<onError\></samp>

**Type:** `<TError>(error: TError, options: ComputedOptions) => void`

Called when an error was thrown (either a response or an unknown error), after [onResponseError](#onresponseerror) and [onUnknownError](#onunknownerror)

**Example:**

```ts
const upfetch = up(fetch, () => ({
   onError: (error, options) => console.log('first')
}))

upfetch('https://example.com/', {
   onError: (error, options) => console.log('second')
})
```

```ts
const upfetch = up(fetch, () => ({
   onResponseError: (error, options) => console.log('first')
   onError: (error, options) => console.log('third')
}))

upfetch('https://example.com/', {
   onResponseError: (error, options) => console.log('second')
   onError: (error, options) => console.log('fourth')
})
```





[MDN]: https://developer.mozilla.org/en-US/docs/Web/API/fetch
