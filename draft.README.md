# up-fetch

Tiny Fetch API wrapper with configurable defaults

## Features

* **Lightweight** - 1kB gzipped
* **Simple** - stays close to the fetch API
* **Intuitive** - automatic body and URL search params (de)serialization, response parsing
* **Customizable** - create instances with custom defaults
* **Type safe** - written with typescript
* **throws by default**
* --> works with Next.js 13 fetch

## QuickStart

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
 * - {'content-type': 'application/json'} is handled automatically
 */
const todo = await upfetch({
   url: 'https://example.com/todos',
   method: 'POST',
   body: { username: 'John', password: '@TempPwd1!' },
})
```

You can create a **custom instance** in order to set a few **defaults**, like the auth headers or the base url.

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

Failed requests **throw by default**

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

## API

> **upfetch(options)**

```ts
upfetch({
   // custom options
   baseUrl,
   url,
   params,
   parseError,
   parseSuccess,
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

> **createFetcher(() => options)**

```ts
createFetcher(() => ({
   // custom options
   baseUrl,
   onError,
   onFetchStart,
   onSuccess,
   parseError,
   parseSuccess,
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

### <samp>\<baseUrl\></samp> <kbd>upfetch</kbd> <kbd>createFetcher</kbd>

**Type:** `string | URL` 

**Default:** `''` 

Sets the base url for the requests

**Example:**

```ts
const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com/id' }))

upfetch()

// Override the default baseUrl
upfetch({ baseUrl: 'https://another-url.com/id' })
```

### <samp>\<url\></samp> <kbd>upfetch</kbd> 

**Type:** `string`

**Default:** `''`

Path to append to the baseUrl, or an entire url.

**Example:**

```ts
const upfetch = createFetcher({ baseUrl: 'https://example.com' })

upfetch({ url: '/id' })

// Override the baseUrl
upfetch({ url: 'https://another-url.com/id' })
```

### <samp>\<params\></samp> <kbd>upfetch</kbd> 

**Type:** `string | Record<string, PrimitiveOrDate | PrimitiveOrDate[]>`

**Default:** `''`

The url search params.
Can be a string or an object containing primitive values, Dates, or an array of those. \
The serialization of the params object can be customized with the `serializeParams` option.

**Example:**

```ts
const upfetch = createFetcher({ baseUrl: 'https://example.com' })

upfetch({ url: '/id' })

// Override the baseUrl
upfetch({ url: 'https://another-url.com/id' })
```





















## Request Config

The request config extends the [Fetch API options](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

```ts
interface RequestConfig extends RequestInit {
   // e.g. https://some-domain.com/api/
   baseUrl?: string | URL
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
   serializeParams?: (params: RequestConfig['params']) => string
   // override the default `body` serialization function
   // takes the `body` (plain object or array only) as an argument and returns a string
   // defaults to (body) => JSON.stringify(body)
   serializeBody?: (body: PlainObject | Array<any>) => string
   // override the default `parseSuccess` function
   // `parseSuccess` is called when `response.ok` is true
   // e.g. (response) => response.blob()
   // parses `text` and `json` responses by default
   parseSuccess?: (response: Response) => Promise<D>
   // override the default `parseError` function
   // `parseError` is called when `response.ok` is false
   // e.g. (response) => response.json()
   // returns a `ResponseError` containing the parsed `text` or `json` response by default
   // check the Error section for more details on `ResponseError`
   parseError?: (res: Response) => Promise<any>

   // TODO: RequestInit methods
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
   headers: ...
   ...
}

```

### ResponseError

## Defaults Config

### Timeout