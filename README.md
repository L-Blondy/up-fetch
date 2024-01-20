# up-fetch (draft docs)

Tiny Fetch API wrapper with configurable defaults

# Features

* **Lightweight** - 1kB gzipped
* **Simple** - stays close to the fetch API
* **Intuitive** - automatic body and URL search params (de)serialization, response parsing
* **Customizable** - create instances with custom defaults
* **Type safe** - written with typescript
* **throws by default**
* --> works with Next.js 13 fetch

# QuickStart

```bash
npm i up-fetch
```

```ts
import { upfetch } from 'up-fetch'

/**
 * - Search params can be defined as object
 * - `json` and `text` responses are parsed by default
 */
const todo = await upfetch({
   url: 'https://example.com/todos',
   params: { q: 'Hello world' },
})

/**
 * - `body` is serialized by default
 * - {'content-type': 'application/json'} header is added automatically
 */
const todo = await upfetch({
   url: 'https://example.com/todos',
   method: 'POST',
   body: { username: 'John', password: '@TempPwd1!' },
})
```

You can create a **custom instance** in order to set a few **defaults**, like the base url or headers. \
Since the **defaults are evaluated at request time** it is the best place to set authentication headers.

```ts
import { createFetcher } from 'up-fetch'

const upfetch = createFetcher(() => ({
   baseUrl: 'https://example.com',
   headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
}))

const todo = await upfetch({
   url: '/todos',
   params: { q: 'Hello world' },
})

const data = await upfetch({
   url: '/todos',
   method: 'POST',
   body: { title: 'Hello', content: 'World' },
})
```

When the Fetch API [response.ok][responseOk] is `false`, the requests **throw by default**.

```ts
import { upfetch, isResponseError } from 'up-fetch'

try {
   const data = await upfetch({
      url: '/todos',
      method: 'POST',
      body: { title: 'Hello', content: 'World' },
   })
}
catch(error) {
   if(isResponseError(error)) { // response status not in the range 200-299
      console.log(error.status, error.data)
   }
   else { // unknown error
      console.log(error)
   }
}
```

# API

### **upfetch(options)**

```ts
upfetch({
   // custom options
   baseUrl,
   url,
   params,
   parseResponse,
   retryDelay,
   retryTimes,
   retryWhen,
   serializeBody,
   serializeParams,
   // tweaked fetch options
   body,
   headers,
   // normal fetch options
   cache,
   credentials,
   integrity,
   keepalive,
   method,
   mode,
   redirect,
   referrer,
   referrerPolicy,
   signal,
   window,
})
```

### **createFetcher(() => options)**

```ts
createFetcher(() => ({
   // custom options
   baseUrl,
   beforeFetch,
   onError,
   onSuccess,
   parseResponse,
   retryDelay,
   retryTimes,
   retryWhen,
   serializeBody,
   serializeParams,
   // tweaked fetch options
   headers,
   // normal fetch options
   cache,
   credentials,
   integrity,
   keepalive,
   method,
   mode,
   redirect,
   referrer,
   referrerPolicy,
   signal,
   window,
}))
```

<!--  -->

## <samp>\<baseUrl\></samp>

**Type:** `string` 

**Default:** `''` 

**Available on:** `upfetch ✔️`, `createFetcher ✔️`

Sets the base url for the requests

**Example:**

```ts
const upfetch = createFetcher(() => ({ 
   baseUrl: 'https://example.com/id' 
}))

// make a GET request at 'https://example.com/id'
upfetch()

// change the baseUrl for a single request
upfetch({ baseUrl: 'https://another-url.com/id' })
```

<!--  -->

## <samp>\<url\></samp>

**Type:** `string`

**Default:** `''`

**Available on:** `upfetch ✔️`, `createFetcher ❌`

Path to append to the baseUrl, or an entire url. 

**Example:**

```ts
const upfetch = createFetcher(() => ({ 
   baseUrl: 'https://example.com' 
}))

// make a GET request at 'https://example.com/id' 
upfetch({ url: '/id' })

// In case the `url` starts with http:// or https:// the `baseUrl` is ignored
upfetch({ url: 'https://another-url.com/id' })
```

<!--  -->

## <samp>\<params\></samp>

**Type:** `Record<string, any> `

**Default:** `{}`

**Available on:** `upfetch ✔️`, `createFetcher ✔️`

The url search params. \
The default params defined in `createFetcher` and the request params are merged shallowly. \
Only non-nested objects are supported by default. See the [serializeParams](#serializeparams-upfetch-createfetcher) option for nested objects.

**Example:**

```ts
const upfetch = createFetcher(() => ({ 
   baseUrl: 'https://example.com' ,
   params : { count: true  }
}))

// use the default `count` param
// https://example.com/?count=true&page=2&limit=10
upfetch({ 
   url: 'https://example.com/',
   params: { page: 2, limit: 10 }
})

// override the default `count`
// https://example.com/?count=false&page=2&limit=10
upfetch({ 
   url: 'https://example.com/',
   params: { page: 2, limit: 10, count: false }
})
```

<!--  -->

## <samp>\<body\></samp>

**Type:** `BodyInit | Record<string, any> | Array<any> | null`

**Default:** `undefined`

**Available on:** `upfetch ✔️`, `createFetcher ❌`

The body of the request.\
Can be pretty much anything. \
See the [serializeBody](#serializebody-upfetch-createfetcher) for more details.

**Example:**

```ts
upfetch({ 
   url: 'https://example.com'
   method: 'POST',
   body: { hello: 'world' } 
})
```

<!--  -->

## <samp>\<method\></samp>

**Type:** `'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'`

**Default:** `'GET'`

**Available on:** `upfetch ✔️`, `createFetcher ✔️`

The method of the request. \
See [MDN][MDN] for more details.

**Example:**

```ts
const upfetch = createFetcher(() => ({
   method: 'GET',
   baseUrl: 'https://example.com'
}))

// override the method
upfetch({ 
   method: 'POST',
   body: { hello: 'world' } 
})
```

<!-- TODO: add correct parameters to the type  -->

## <samp>\<serializeParams\></samp>

**Type:** `(params: Record<string, any> ) => string`

**Available on:** `upfetch ✔️`, `createFetcher ✔️`

This option is used to customize the [params](#params-upfetch) serialization into a query string. \
The default implementation supports non-nested objects only.

**Example:**

```ts
import qs from 'qs'

// add support for nested objects
const upfetch = createFetcher(() => ({
   baseUrl: 'https://example.com',
   serializeParams: (params) => {
      qs.stringify(params)
   }
}))

// https://example.com/todos?a[b]=c
upfetch({ 
   url: '/todos'
   params: { a: { b: 'c' } }
})
```

<!-- TODO: add correct parameters to the type  -->

## <samp>\<serializeBody\></samp>

**Type:** `(body: Record<string, any> | any[]) => string`

**Default:** `JSON.stringify`

**Available on:** `upfetch ✔️`, `createFetcher ✔️`

This option is used to customize the [body](#body-upfetch) serialization into a string. \
The [body](#body-upfetch) is passed to `serializeBody` when it is a plain object, an array or a class instance with a `toJSON` method. The other body types remain untouched

**Example:**

```ts
import stringify from 'json-stringify-safe'

// Add support for circular references.
const upfetch = createFetcher(() => ({
   baseUrl: 'https://example.com/',
   serializeBody: (body) => {
      stringify(body)
   }
}))

upfetch({ 
   body: { imagine: 'a circular ref' }
})
```


















## Request Options

The request config extends the [Fetch API options][MDN]

```ts
interface FetchOptions extends RequestInit {
   // e.g. https://some-domain.com/api/
   baseUrl?: string
   // `url` will be appended to the URL 
   // if it starts with http(s):// the baseUrl will be ignored
   url?: string
   // `params` correspond to the URL search params / query string
   // params: { q: 'hello world' } will produce `https://example.com/?q=hello+world
   // type PrimitiveOrDate = string | number | Date | boolean | null | undefined
   params?: string | {Record<string, PrimitiveOrDate | PrimitiveOrDate[]>}
   // same as RequestInit + plain objects and arrays
   // e.g. body: { key: 'value' } or body: [1, 2, 3]
   body?: BodyInit | PlainObject | Array<any> | null 
   // override the default `params` serialization function
   // takes the `params` object as an argument and returns the query string
   // that will be appended to the url
   // You may omit the question mark
   serializeParams?: (params: FetchOptions['params']) => string
   // override the default `body` serialization function
   // takes the `body` (plain object or array only) as an argument and returns a string
   // defaults to (body) => JSON.stringify(body)
   serializeBody?: (body: PlainObject | Array<any>) => string
   // override the default `parseResponse` function
   // `parseResponse` is called when `response.ok` is true
   // e.g. (response) => response.blob()
   // parses `text` and `json` responses by default
   parseResponse?: (response: Response) => Promise<D>

   // TODO: RequestInit methods
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   headers: ...
   ...
}

```

### ResponseError

## Defaults Options

### Timeout

# Compatibility 

## Browsers

✅ chrome 80\
✅ edge 80 \
✅ safari 13.1\
✅ firefox 74\
✅ opera 67

## Node

✅ **Node >= 18** works without polyfills\
✅ **Node >= 14.18.0** with [polyfills](#polyfills)

### Polyfills

Polyfills are required for node versions between *14.18.0* and *18* (excluded).

First install [node-fetch](https://github.com/node-fetch/node-fetch)

```bash
npm i node-fetch
```

Then paste the following code into your entry file 

```js
import fetch, { Headers } from 'node-fetch'

if (!globalThis.fetch) {
   globalThis.fetch = fetch
   globalThis.Headers = Headers
}
```

[MDN]: https://developer.mozilla.org/en-US/docs/Web/API/fetch
[URLSearchParams]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
[toISOString]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
[responseOk]: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
[entries]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries