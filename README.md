# up-fetch (draft docs)

Tiny [fetch API][MDN] wrapper with configurable defaults

# Highlights

* **Lightweight** - 1kB gzipped
* **Simple** - stays close to the fetch API
* **Intuitive** - automatic body and URL search params (de)serialization, response parsing
* **Customizable** - create instances with custom defaults
* **Type safe** - written with typescript
* **throws by default**

# QuickStart

```bash
npm i up-fetch
```

Create a new upfetch instance

```ts
export const upfetch = up(fetch)
```

Make a fetch request

```ts
import { upfetch } from '...'

const todos = await upfetch('https://my.url/todos', {
   params: { search: 'Hello world' },
})
```

Note that upfetch options extend fetch options. Anything that can be done with fetch can be done the same way with upfetch.

# Features

### The response is parsed automatically

The parsing method is customizable via the [parseResponse](#parseresponse) option

```ts
// before
const response = await fetch('https://my.url/todos')
const todos = await response.json()

// after
const todos = await upfetch('https://my.url/todos')
```

### The `'application/json'` content-type header is added when necessary

```ts
// before
const response = await fetch('https://my.url/todos', {
   headers: {'Content-Type': 'application/json'}
})
const todos = await response.json()

// after
const todos = await upfetch('https://my.url/todos')
```

### `params` as object

```ts
// before
fetch(`https://my.url/todos?search=${search}&skip=${skip}&take=${take}`)

// after
upfetch('https://my.url/todos', {
   params: { search, skip, take },
})
```

### `body` as object

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


### throws by default

Throws a `ResponseError` when `response.ok` is `false`

The `ResponseError` contains the parsed response data, the response and the options used make the api call.

```ts
import { isResponseError } from 'up-fetch'

try {
   await upfetch('https://my.url/todos')
} 
catch(error){
   if(isResponseError(error)){
      console.log(error.data)
   } else {
      console.log('unknown error')
   }
}
```

# Examples

Authentication
Error handling (server response vs unknown response)
Form data
Conditionally override the defaults

DONT extend upfetch instance

# Options

All options can be set either on **up** or on an **upfetch** instance except for the `body`

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

See the `type definitions` for more details

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

See the `type definitions` for more details

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

See the `type definitions` for more details

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

<!-- TODO: check the links  -->

## <samp>\<parseUnknownError\></samp>

**Type:** `ParseUnknownError<TError> = (error: any, options: ComputedOptions) => TError`

See the `type definitions` for more details

Customize the parsing of an unknown fetch error (eg. when the server did not respond) \
<!-- TODO: link -->

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

<!-- TODO: check the links  -->

## <samp>\<onBeforeFetch\></samp>

**Type:** `(options: ComputedOptions) => void`

See the `type definitions` for more details

Called just before the `fetch` call is made

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

See the `type definitions` for more details

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

See the `type definitions` for more details

<!-- TODO: link -->
Called when a response error was generated (response.ok is false), before `onError`

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

See the `type definitions` for more details

<!-- TODO: link -->
Called when an unknown error was generated (an error that is not a response error), before `onError` 

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

See the `type definitions` for more details

<!-- TODO: link -->
Called when an error was generated (either a response or an unknown error), after onResponseError and onUnknownError

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

[parseResponse]: https://github.com/L-Blondy/up-fetch?tab=readme-ov-file#parseresponse
[parseResponse2]: #parseresponse