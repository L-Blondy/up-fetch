# up-fetch (draft docs)

Tiny Fetch API wrapper with configurable defaults

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

### throws by default

Throws when `response.ok` is `false`

### The response is parsed automatically

<!-- TODO: link to parseResponse -->
The parsing method is customizable via the `parseResponse` option

```ts
// before
const response = await fetch('https://my.url/todos')
const todos = await response.json()

// after
const todos = await fetch('https://my.url/todos')
```

### The `'Content-Type': 'application/json'` header is added when necessary

```ts
// before
const response = await fetch('https://my.url/todos', {
   headers: {'Content-Type': 'application/json'}
})
const todos = await response.json()

// after
const todos = await fetch('https://my.url/todos')
```

### Define the `params` as object

```ts
// before
fetch(`https://my.url/todos?search=${search}&skip=${skip}&take=${take}`)

// after
upfetch('https://my.url/todos', {
   params: { search, skip, take },
})
```

### Define the `body` as object

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

### Share a `baseUrl` between requests

Set the baseUrl on the instance

```ts
export const upfetch = up(fetch, () => ({
   baseUrl: 'https://my.url'
}))
```

The baseUrl can then be omitted 

```ts
const todos = await fetch('/todos')
```

# Examples

Authentication
Error handling (server response vs unknown response)
Form data

DONT extend upfetch instance

# API

<!-- TODO: link to the fetch API -->
**upfetch** adds the following options to the `fetch API`. 

All options can be set either on **up** or on an **upfetch** instance

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

<!-- TODO: check the link -->
The url search params. \
The default params defined in `up` and the `upfetch` instance params are shallowly merged. \
Only non-nested objects are supported by default. See the [serializeParams](#serializeparams-upfetch-createfetcher) option for nested objects.

**Example:**

```ts
const upfetch = up(fetch, () => ({ 
   baseUrl: 'https://example.com' ,
   params : { expand: true  }
}))

// The default `expand` can be omitted
// the request is sent to: https://example.com/?expand=true&page=2&limit=10
upfetch({ 
   url: 'https://example.com/',
   params: { page: 2, limit: 10 }
})

// override the default `expand` value
// https://example.com/?expand=false&page=2&limit=10
upfetch({ 
   url: 'https://example.com/',
   params: { page: 2, limit: 10, expand: false }
})

// remove the `expand` param
// https://example.com/?expand=false&page=2&limit=10
upfetch({ 
   url: 'https://example.com/',
   params: { page: 2, limit: 10, expand: undefined }
})
```

<!--  -->

## <samp>\<body\></samp>

**Type:** `BodyInit | JsonifiableObject | JsonifiableArray | null`

Note that this option is not available on **up**

The body of the request.\
Can be pretty much anything. \
See the [serializeBody](#serializebody-upfetch-createfetcher) for more details.

**Example:**

```ts
upfetch('/todos', { 
   method: 'POST',
   body: { hello: 'world' } 
})
```

<!--  -->

<!-- TODO: check the link  -->

## <samp>\<serializeParams\></samp>

**Type:** `(params: { [key: string]: any } ) => string`

This option is used to customize the [params](#params-upfetch) serialization into a query string. \
The default implementation supports non-nested objects only.

**Example:**

```ts
import qs from 'qs'

// add support for nested objects using the 'qs' library
const upfetch = up(fetch, () => ({
   baseUrl: 'https://example.com',
   serializeParams: (params) => qs.stringify(params)
}))

// https://example.com/todos?a[b]=c
upfetch({ 
   url: '/todos'
   params: { a: { b: 'c' } }
})
```

<!-- TODO: check the links  -->

## <samp>\<serializeBody\></samp>

**Type:** `(body: JsonifiableObject | JsonifiableArray) => string`

**Default:** `JSON.stringify`

This option is used to customize the [body](#body-upfetch) serialization into a string. \
The [body](#body-upfetch) is passed to `serializeBody` when it is a plain object, an array or a class instance with a `toJSON` method. The other body types remain untouched

**Example:**

```ts
import stringify from 'json-stringify-safe'

// Add support for circular references.
const upfetch = up(fetch, () => ({
   baseUrl: 'https://example.com/',
   serializeBody: (body) => stringify(body)
}))

upfetch({ 
   body: { now: 'imagine a circular ref' }
})
```

<!-- 
parseResponse
parseResponseError
parseUnknownError
onBeforeFetch
onError
onResponseError
onSuccess
onUnknownError
-->







[MDN]: https://developer.mozilla.org/en-US/docs/Web/API/fetch
[URLSearchParams]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
[toISOString]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
[responseOk]: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
[entries]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries