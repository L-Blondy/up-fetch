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
	.then((todos)=> console.log(todos))
	.catch((error) => console.log(error))

// With Authentication
upfetch({
   url: 'https://example.com/todos',
	headers: { 'Authorization': `Bearer ${AUTH_TOKEN}`}
   params: { q: 'Hello world' },
})
	.then((todos)=> console.log(todos))
	.catch((error) => console.log(error))
```

Optionally you can create a custom instance in order to set some defaults

```ts
import {upfetchFactory} from 'up-fetch'

const upfetch = upfetchFactory.create(()=>({
	baseUrl: 'https://example.com,
	headers: { Authorization: `Bearer ${AUTH_TOKEN}`}
}))

upfetch({
   url: '/todos',
   params: { q: 'Hello world' },
})
	.then((todos)=> console.log(todos))
	.catch((error) => console.log(error))
```

### Authentication

### Headers

### Serialization
