# up-fetch

up-fetch 是一个仅有 1kb 大小，同时集成了一些合理配置的 Fetch API 工具。

## 特点

-  🚀 轻量 - 生产版本只有 1KB，没有其它依赖
-  🤩 简单 - 基于 Fetch API，扩展了配置项，并集成了默认配置
-  🎯 直观 - params 和 body 可以是普通对象，同时，Response 开箱即用
-  🔥 灵活 - 复杂的场景下，支持自定义序列化和解析策略
-  💫 复用 - 可创建带自定义默认项的实例
-  💪 强类型 - 优秀的类型推断和自动补全能力
-  🤯 校验适配器 -（可选）使用 zod 或 valibot 校验数据，以获得最大程度上的类型安全性
-  👻 异常默认抛出 - 当 response.ok 为 false 时
-  😉 适用环境广泛 - 所有现代浏览器、bun、node 18+、deno（使用 npm: 限定符）
-  📦 树摇优化 - 只打包使用到的内容

## 快速上手

```bash
npm i up-fetch
```

创建一个 upfetch 实例

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch)
```

发送请求

```ts
const todo = await upfetch('https://a.b.c', {
   method: 'POST',
   body: { hello: 'world' },
})
```

可以为所有的请求设定一些默认选项。\
默认项支持动态设定，在**每次请求生成时获取**，这对认证场景有很大帮助。

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
   headers: { Authorization: localStorage.getItem('bearer-token') },
}))
```

因为 **`up` 方法** 是基于 Fetch API 进行扩展，所以任何 Fetch API 支持的特性，up-fetch 也都可以兼容。

```ts
// baseUrl 和 Authorization header 可以不被设定
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

同样，也支持其它任何基于 Fetch API 规范实现的第三方工具，例如 [undici](https://github.com/nodejs/undici) 或者 [node-fetch](https://github.com/node-fetch/node-fetch)

```ts
import { fetch } from 'undici'

const upfetch = up(fetch)
```

### 原生 fetch vs upfetch

**当 response.ok 为 false 时，抛出异常的原生 fetch 示例：**

首先创建一个自定义的 ResponseError 类，该类扩展了内置的 Error 类，以便导出 Response 和解析后的 Response 数据。

简单的实现可能如下所示：

```javascript
export class ResponseError extends Error {
   constructor(response, data) {
      super(`Request failed with status ${res.status}`)
      this.data = data
      this.name = 'ResponseError'
      this.response = response
      this.status = response.status
   }
}
```

然后，在 fetcher 方法中使用方式如下：

```javascript
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

**相同场景下，up-fetch 的写法**
如果您已经创建了一个 upfetch 实例，上面的示例就可以这样写了：

```javascript
const fetchData = (params) => upfetch('https://a.b.c', { params })
```

## 特性

### ✔️ 为 upfetch 实例设定默认项

**up-fetch** 的默认行为可以完全自定义

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
   headers: { 'X-Header': 'hello world' },
}))
```

可以查看完整的 [options](#%EF%B8%8F-api) 列表

### ✔️ URL `params` 可以是对象

```ts
// 普通fetch
fetch(`https://a.b.c/?search=${search}&skip=${skip}&take=${take}`)

// up-fetch
upfetch('https://a.b.c', {
   params: { search, skip, take },
})
```

### ✔️ `baseUrl` 选项

在创建 upfetch 实例时，设定 baseUrl

```ts
export const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
}))
```

后续在每次发送请求时，都可以不用再带上 baseUrl

```ts
const todos = await upfetch('/todos')
```

### ✔️ 自动解析 `Response`

解析方法支持自定义 [parseResponse](#parseresponse)

```ts
// 普通fetch
const response = await fetch('https://a.b.c')
const todos = await response.json()

// upfetch
const todos = await upfetch('https://a.b.c')
```

### ✔️ 异常默认抛出

假如 `response.ok` 是 `false`，会抛出 `ResponseError` 异常。

解析后的异常信息可以通过 `error.data`获取。 \
原始的 response 数据可以通过 `error.response` 获取。 \
用于 api 调用的选项可通过`error.options`获取。

```ts
import { isResponseError } from 'up-fetch'
import { upfetch } from '...'

try {
   await upfetch('https://a.b.c')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.data)
      console.log(error.status)
   } else {
      console.log('Request error')
   }
}
```

### ✔️ `body` 可设定为 json 格式

如果 body 是可转换为 JSON 格式的 object 或 数组， 请求头中会自动设定 `'Content-Type': 'application/json'` 。
普通 object, 数组和带有 `toJSON` 方法的类实例都认为是可转成 JSON 格式的数据类型。

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

### ✔️ 数据校验

**up-fetch** 内部集成了一些基于 [zod](https://zod.dev/) 和 [valibot](https://valibot.dev/) 的适配器

首先需要安装 `zod` 或 `valibot`...

```bash
npm i zod
# or
npm i valibot
```

接下来就可以使用内部集成的一些数据校验 helper，这些 helper 方法支持 Tree Shaking 。

**zod 示例：**

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

**valibot 示例：**

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

如果出现错误，适配器将抛出异常。可以通过[onParsingError]（#onParsingError）来监听这些错误信息。\
同样，适配器也可以用于`parseResponseError`

### ✔️ 拦截器

可以为所有的请求设定拦截器。

```ts
const upfetch = up(fetch, () => ({
   onBeforeFetch: (options) => console.log('Before fetch'),
   onSuccess: (data, options) => console.log(data),
   onResponseError: (error, options) => console.log(error),
   onRequestError: (error, options) => console.log(error),
   onParsingError: (error, options) => console.log(error),
}))
```

也可以为单次请求设定拦截器

```ts
upfetch('/todos', {
   onBeforeFetch: (options) => console.log('Before fetch'),
   onSuccess: (todos, options) => console.log(todos),
   onResponseError: (error, options) => console.log(error),
   onRequestError: (error, options) => console.log(error),
   onParsingError: (error, options) => console.log(error),
})
```

[了解更多](#onbeforefetch).

### ✔️ timeout

值得一提的是，由于[AbortSignal.timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)方法现在已经非常普及，因此**up-petch**不提供任何 `timeout` 选项。

```ts
upfetch('/todos', {
   signal: AbortSignal.timeout(5000),
})
```

## ➡️ 示例

<details><summary><b>💡 认证</b></summary><br />

由于默认项是在请求时获取的, 所以 Authentication header 可以在 `up` 方法中定义。

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
// ❌ 不要在 `up` 方法之外读取 storage / cookies

// bearerToken 从不会改变
const bearerToken = localStorage.getItem('bearer-token')

const upfetch = up(fetch, () => ({
   headers: { Authentication: bearerToken },
}))
```

```ts
// ✅ `up` 方法的第二个参数如果是一个函数，会在每次请求时被调用用于获取 **默认项** 数据

// 每次请求时都去 localStorage 中读取数据
const upfetch = up(fetch, () => ({
   headers: { Authentication: localStorage.getItem('bearer-token') },
}))
```

`cookies` 同理。

</details>

<details><summary><b>💡 支持 HTTP 代理 (仅 node 环境下)</b></summary><br />

_April 2024_

Node, bun 和 浏览器实现的 fetch API 不支持 HTTP 代理。

要想使用 HTTP 代理，需要借助 [undici](https://github.com/nodejs/undici) (仅 node 环境下)

_单次请求中使用 HTTP 代理_

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

_为每次请求动态添加 HTTP 代理_

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

<details><summary><b>💡 错误处理</b></summary><br />

当 `response.ok` 为 `false` 时，**up-fetch** 抛出 [ResponseError](#%EF%B8%8F-throws-by-default) 异常。

解析后的异常信息可以通过 `error.data`获取。 \
原始的 response status 可以通过 `error.status` 获取。 \
用于 api 调用的选项可通过`error.options`获取。

[type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types) `isResponseError` 可以用于判断当前 error 是否是 `ResponseError`

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
      console.log(error.status)
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
      console.log(error.status)
      console.log(error.options)
   } else {
      console.log(error.name)
      console.log(error.message)
   }
})
```

**up-fetch** 还提供了一些 listener, 对日志记录有很大帮助。

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

<details><summary><b>💡 删除默认项</b></summary><br />

只需要设定值为 `undefined` 即可。

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

<details><summary><b>💡 根据特定条件选择是否覆盖默认值</b></summary><br />

有时候可能需要有条件地覆盖 `up` 方法中提供的默认选项。这对 Javascript 来说，有点麻烦：

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   headers: { 'X-Header': 'value' }
}))

❌ 不要
// if `condition` is false, the header will be deleted
upfetch('https://a.b.c', {
   headers: { 'X-Header': condition ? 'newValue' : undefined }
})
```

为解决上述问题, 当`up` 方法第二个参数是函数类型时，upfetch 提供 `defaultOptions` 作为其参数. \
`defaultOptions` 类型严格 (const 泛型)

```ts
✅ OK
upfetch('https://a.b.c', (defaultOptions) => ({
   headers: { 'X-Header': condition ? 'newValue' : defaultOptions.headers['X-Header'] }
}))
```

</details>

<details><summary><b>💡 Next.js 路由</b></summary><br />

因为 **up-fetch** 基于 fetch API 进行扩展, 所以 **Next.js** 特定的 [fetch options](https://nextjs.org/docs/app/api-reference/functions/fetch) 也适用于 **up-fetch**.

**_设定默认缓存策略_**

```ts
import { up } from 'up-fetch'

const upfetch = up(fetch, () => ({
   next: { revalidate: false },
}))
```

**_特定请求覆盖_**

```ts
upfetch('/posts', {
   next: { revalidate: 60 },
})
```

</details>

## ➡️ Types

请参阅[类型定义](https://github.com/L-Blondy/up-fetch/blob/master/src/types.ts)取更多详细信息

## ➡️ API

除了[body]（#body）之外，所有选项都可以在**up**或**upfetch**实例上设置。

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

在[fetch API][MDN] 的基础上，**upfetch** 新增了如下选项.

<!--  -->

## <samp>\<baseUrl\></samp>

**Type:** `string`

设定 baseUrl

**示例：**

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

查询参数 \
在 `up` 和 `upfetch` 方法中分别定义的参数会被 **shallowly merged**. \
默认情况下，仅支持非嵌套对象。有关嵌套对象的处理，可以借助[serializeParams]（#serializeParams）选项。

**示例：**

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
upfetch('https://a.b.c', (defaultOptions) => ({
   params: { expand: isTruthy ? true : defaultOptions.params.expand },
}))
```

<!--  -->

## <samp>\<headers\></samp>

**Type:** `HeadersInit | Record<string, string | number | null | undefined>`

与 fetch API headers 兼容，但有更广泛的类型支持. \
在 `up` 和 `upfetch` 中分别定义的 header 同样会被 **shallowly merged**. \

**示例：**

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
upfetch('https://a.b.c', (defaultOptions) => ({
   headers: {
      Authorization: isTruthy ? 'Bearer ...3' : defaultOptions.headers.val,
   },
}))
```

<!--  -->

## <samp>\<body\></samp>

**Type:** `BodyInit | JsonifiableObject | JsonifiableArray | null`

PS: 这个选项在 **up** 方法中不可用 🚫。

设定请求中的 body.\
可以是任何类型的数据. \
具体信息可以参考[serializeBody](#serializebody).

**示例：**

```ts
upfetch('/todos', {
   method: 'POST',
   body: { hello: 'world' },
})
```

<!--  -->

## <samp>\<serializeParams\></samp>

**Type:** `(params: { [key: string]: any } ) => string`

自定义 [params](#params) 的序列化方法. \
默认仅支持 **非嵌套的 objects**.

**示例：**

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

自定义 [body](#body) 序列化方法. \
当 body 是普通对象、数组或具有 `toJSON` 方法的类实例时，将被传递给 `serializeBody`，其他类型保持不变

**示例：**

```ts
import stringify from 'json-stringify-safe'

// Add support for circular references.
const upfetch = up(fetch, () => ({
   serializeBody: (body) => stringify(body),
}))

upfetch('https://a.b.c', {
   body: { now: 'imagine a circular ref' },
})
```

## <samp>\<parseResponse\></samp>

**Type:** `ParseResponse<TData> = (response: Response, options: ComputedOptions) => Promise<TData>`

自定义 Response 解析方法. \
默认情况下，先解析成`json` ，其次选择 `text` 格式。

这个选项最好配合 [validation adapter](#%EF%B8%8F-data-validation) 使用。

**示例：**

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

**添加校验适配器：**

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

自定义 Response Error 的解析方法 (`response.ok` 为 `false` 时) \
默认情况下抛出 [ResponseError](#%EF%B8%8F-throws-by-default) 异常

**示例：**

```ts
// throw a `CustomResponseError` when `response.ok` is `false`
const upfetch = up(fetch, () => ({
   parseResponseError: (res) => new CustomResponseError(res),
}))
```

`parseResponse` 可以用于 [validation adapter](#%EF%B8%8F-data-validation)

## <samp>\<onSuccess\></samp>

**Type:** `<TData>(data: TData, options: ComputedOptions) => void`

当 `response.ok` 为 `true` 时调用

**示例：**

```ts
const upfetch = up(fetch, () => ({
   onSuccess: (data, options) => console.log('2nd'),
}))

upfetch('https://a.b.c', {
   onSuccess: (data, options) => console.log('1st'),
})
```

## <samp>\<onResponseError\></samp>

**Type:** `<TError>(error: TError, options: ComputedOptions) => void`

当响应异常抛出时调用 (`response.ok` 为 `false`).

**示例：**

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

当请求失败时调用 (没有收到服务器响应).

**示例：**

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

当 `parseResponse` 或 `parseResponseError` 异常产生时调用. \
这在使用 [validation adapter](#%EF%B8%8F-data-validation) 时非常有用

**示例：**

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

请求发送之前被调用.

**示例：**

```ts
const upfetch = up(fetch, () => ({
   onBeforeFetch: (options) => console.log('2nd'),
}))

upfetch('https://a.b.c', {
   onBeforeFetch: (options) => console.log('1st'),
})
```

## ➡️ 兼容性

-  ✅ All modern browsers
-  ✅ Bun
-  ✅ Node 18+
-  ✅ Deno (with the `npm:` specifier)

[MDN]: https://developer.mozilla.org/en-US/docs/Web/API/fetch
