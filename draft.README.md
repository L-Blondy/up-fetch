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
import {upfetch} from 'up-fetch'

// A simple GET request
upfetch({
   url: 'https://example.com/todos',
   params: { q: 'Hello world' },
})
   .then((todos) => console.log(todos))
   .catch((error) => console.log(error))

// With Authentication
upfetch({
   url: 'https://example.com/todos',
   method: 'POST',
   headers: { 'Authorization': `Bearer ${AUTH_TOKEN}`},
   body: { title: 'Hello', content: 'World' },
})
   .then((data) => console.log(data))
   .catch((error) => console.log(error))
```

Optionally you can create a custom instance in order to set some defaults

```ts
import {createFetcher} from 'up-fetch'

const upfetch = createFetcher(() => ({
   baseUrl: 'https://example.com',
   headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
}))

upfetch({
   url: '/todos',
   params: { q: 'Hello world' },
})

upfetch({
   url: '/todos',
   method: 'POST',
   body: { title: 'Hello', content: 'World' },
})
```

## API

### \<baseUrl\> 

**Type:** `string | URL`

**Default:** `''`

**Available in:** `upfetch`, `createFetcher`.

**Description:** sets the base url for the requests

**Example:**

```ts
upfetch({ baseUrl: 'https://example.com/todos' })

// OR

const upfetch = createFetcher(() => ({ baseUrl: 'https://example.com/todos' }))

upfetch()
```

### \<url\> 

**Type:** `string`

**Default:** `''`

**Available in:** `upfetch`.

Path to append to the baseUrl, or an entire url.

**Examples:**

```ts
upfetch({ url: 'https://example.com/todos' })

// OR

const upfetch = createFetcher({ baseUrl: 'https://example.com' })

upfetch({ url: '/todos' })
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