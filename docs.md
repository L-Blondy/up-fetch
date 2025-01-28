# up-fetch

Tiny & Composable fetch configuration tool with sensible defaults and built-in schema validation.

## ➡️ Highlights

- 🚀 **Lightweight** - 1kB gzipped, no dependency
- 🔒 **Standard Schema** - Built-in schema validation with **zod**, **valibot** or **arktype**. Check out the full list [here](<[text](https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec)>)
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

const data = await upfetch('https://api.example.com/todos/1', {
   schema: s.object({
      id: s.number(),
      title: s.string(),
      completed: s.boolean(),
   }),
})
```

`data` is properly typed based on the schema.

## ➡️ Key Features

### ✔️ Request Configuration

Set defaults for all requests when creating an instance:

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://api.example.com',
   headers: { Authorization: localStorage.getItem('bearer-token') },
}))
```

### ✔️ Simple Query Parameters

```ts
// Before with fetch
fetch(
   `https://api.example.com/todos?search=${search}&skip=${skip}&take=${take}`,
)

// After with up-fetch
upfetch('/todos', {
   params: { search, skip, take },
})
```

### ✔️ Automatic Body Handling

JSON bodies are automatically handled:

```ts
// Before with fetch
fetch('https://api.example.com/todos', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ title: 'New Todo' }),
})

// After with up-fetch
upfetch('/todos', {
   method: 'POST',
   body: { title: 'New Todo' },
})
```

### ✔️ Schema Validation

Built-in support for [standard-schema](https://github.com/standard-schema/standard-schema) ensures type-safe API responses:

```ts
import { s } from 'standard-schema'

const todoSchema = s.object({
   id: s.number(),
   title: s.string(),
   completed: s.boolean(),
})

const todo = await upfetch('/todos/1', {
   schema: todoSchema,
})
// todo is typed as { id: number; title: string; completed: boolean }
```

### ✔️ Error Handling

up-fetch throws a `ResponseError` when `response.ok` is `false`. The error includes:

- `error.data`: The parsed error body
- `error.response`: The raw Response
- `error.status`: The HTTP status code
- `error.options`: The options used for the request

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

### ✔️ Lifecycle Hooks

Control request/response lifecycle with simple hooks:

```ts
const upfetch = up(fetch, () => ({
   onBeforeFetch: (options) => {
      // Modify options before the request
      return options
   },
   onSuccess: (response, data) => {
      // Handle successful responses
      return data
   },
   onError: (error) => {
      // Handle errors
      throw error
   },
}))
```

## ➡️ API Reference

### Options

| Option                          | Type          | Description                                    |
| ------------------------------- | ------------- | ---------------------------------------------- |
| `baseUrl`                       | `string`      | Base URL for all requests                      |
| `params`                        | `object`      | Query parameters                               |
| `body`                          | `any`         | Request body (automatically stringified)       |
| `schema`                        | `Schema`      | standard-schema schema for response validation |
| `headers`                       | `HeadersInit` | Request headers                                |
| ...and all native fetch options |               |                                                |

### Hooks

| Hook            | Parameters                 | Description                 |
| --------------- | -------------------------- | --------------------------- |
| `onBeforeFetch` | `(options) => options`     | Modify request options      |
| `onSuccess`     | `(response, data) => data` | Handle successful responses |
| `onError`       | `(error) => void`          | Handle errors               |
