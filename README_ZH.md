<h1 align="center">upfetch - 高级 fetch 客户端构建器</h1>
<br>
<p align="center">
<img src="https://raw.githubusercontent.com/L-Blondy/up-fetch/refs/heads/master/logos/upfetch-logo-gold.svg" alt="upfetch">
</p>
<br>
<p align="center">
   <a href="https://www.npmjs.com/package/up-fetch"><img src="https://img.shields.io/npm/v/up-fetch.svg?color=EFBA5F" alt="npm version"></a>
   <a href="https://bundlephobia.com/package/up-fetch"><img src="https://img.shields.io/bundlephobia/minzip/up-fetch?color=EFBA5F" alt="npm bundle size"></a>
   <a href="https://github.com/L-Blondy/up-fetch/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/up-fetch.svg?color=EFBA5F" alt="license"></a>
   <a href="https://github.com/L-Blondy/up-fetch/graphs/commit-activity"><img src="https://img.shields.io/github/commit-activity/m/L-Blondy/up-fetch?color=EFBA5F" alt="commit activity"></a>
   <a href="https://www.npmjs.com/package/up-fetch"><img src="https://img.shields.io/npm/dm/up-fetch.svg?color=EFBA5F" alt="downloads per month"></a>
</p>
<br>

_upfetch_ 是一个高级的 fetch 客户端构建器，具有标准模式验证、自动响应解析、智能默认值等功能。旨在使数据获取类型安全且开发人员友好，同时保持熟悉的 fetch API。

> **警告**
> 此中文翻译由人工智能生成。如果您发现任何错误或有改进建议，欢迎提交 Pull Request。

## 🔄 从 v1 版本迁移

查看我们的 [迁移指南](./MIGRATION_v1_v2.md) - 重大更改仅影响高级用例。\
寻找 v1 版本的文档？[点击这里](https://github.com/L-Blondy/up-fetch/tree/v1.3.6/README.md)。

## 目录

-  [亮点](#️-亮点)
-  [快速开始](#️-快速开始)
-  [主要特性](#️-主要特性)
   -  [请求配置](#️-请求配置)
   -  [简单查询参数](#️-简单查询参数)
   -  [自动处理请求体](#️-自动处理请求体)
   -  [模式验证](#️-模式验证)
   -  [生命周期钩子](#️-生命周期钩子)
   -  [超时设置](#️-超时设置)
   -  [重试](#️-重试)
   -  [错误处理](#️-错误处理)
-  [使用方法](#️-使用方法)
   -  [身份验证](#️-身份验证)
   -  [删除默认选项](#️-删除默认选项)
   -  [表单数据](#️-表单数据)
   -  [HTTP 代理](#️-http-代理)
   -  [多个 fetch 客户端](#️-多个-fetch-客户端)
-  [高级用法](#️-高级用法)
   -  [错误作为值](#️-错误作为值)
   -  [自定义响应解析](#️-自定义响应解析)
   -  [自定义响应错误](#️-自定义响应错误)
   -  [自定义参数序列化](#️-自定义参数序列化)
   -  [自定义请求体序列化](#️-自定义请求体序列化)
   -  [基于请求的默认值](#️-基于请求的默认值)
-  [API 参考](#️-api-参考)
-  [功能比较](#️-功能比较)
-  [环境支持](#️-环境支持)

## ➡️ 亮点

-  🚀 **轻量级** - 压缩后仅 1.2kB，无依赖
-  🔒 **类型安全** - 使用 [zod][zod]、[valibot][valibot] 或 [arktype][arktype] 验证 API 响应
-  🛠️ **实用的 API** - 使用对象作为 `params` 和 `body`，自动获取解析后的响应
-  🎨 **灵活配置** - 一次设置 `baseUrl` 或 `headers` 等默认值，随处使用
-  🤝 **熟悉的使用方式** - 与 fetch 相同的 API，但具有额外选项和合理的默认值

## ➡️ 快速开始

```bash
npm i up-fetch
```

创建新的 upfetch 实例：

```ts
import { up } from 'up-fetch'

export const upfetch = up(fetch)
```

使用模式验证进行 fetch 请求：

```ts
import { upfetch } from './upfetch'
import { z } from 'zod'

const user = await upfetch('https://a.b.c/users/1', {
   schema: z.object({
      id: z.number(),
      name: z.string(),
      avatar: z.string().url(),
   }),
})
```

响应已经基于模式进行了**解析**和正确的**类型推断**。

_upfetch_ 扩展了原生 fetch API，这意味着所有标准的 fetch 选项都可用。

## ➡️ 主要特性

### ✔️ 请求配置

创建实例时为所有请求设置默认值：

```ts
const upfetch = up(fetch, () => ({
   baseUrl: 'https://a.b.c',
   timeout: 30000,
}))
```

查看 [API 参考][api-reference] 获取完整的选项列表。

### ✔️ 简单查询参数

👎 使用原生 fetch：

```ts
fetch(
   `https://api.example.com/todos?search=${search}&skip=${skip}&take=${take}`,
)
```

👍 使用 _upfetch_：

```ts
upfetch('/todos', {
   params: { search, skip, take },
})
```

使用 [serializeParams][api-reference] 选项自定义查询参数序列化。

### ✔️ 自动处理请求体

👎 使用原生 fetch：

```ts
fetch('https://api.example.com/todos', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ title: 'New Todo' }),
})
```

👍 使用 _upfetch_：

```ts
upfetch('/todos', {
   method: 'POST',
   body: { title: 'New Todo' },
})
```

_upfetch_ 也支持所有 [fetch body 类型](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#body)。

查看 [serializeBody][api-reference] 选项自定义请求体序列化。

### ✔️ 模式验证

由于 _upfetch_ 遵循 [Standard Schema Specification][standard-schema]，它可以与任何实现该规范的模式库一起使用。\
查看完整列表 [这里][standard-schema-libs]。

👉 使用 **zod** 3.24+

```ts
import { z } from 'zod'

const posts = await upfetch('/posts/1', {
   schema: z.object({
      id: z.number(),
      title: z.string(),
   }),
})
```

👉 使用 **valibot** 1.0+

```ts
import { object, string, number } from 'valibot'

const posts = await upfetch('/posts/1', {
   schema: object({
      id: number(),
      title: string(),
   }),
})
```

### ✔️ 生命周期钩子

使用简单的钩子控制请求/响应生命周期：

```ts
const upfetch = up(fetch, () => ({
   onRequest: (options) => {
      // 在发出请求之前调用，可以在此处修改选项
   },
   onSuccess: (data, options) => {
      // 请求成功完成时调用
   },
   onError: (error, options) => {
      // 请求失败时调用
   },
}))
```

### ✔️ 超时设置

为单个请求设置超时：

```ts
upfetch('/todos', {
   timeout: 3000,
})
```

为所有请求设置默认超时：

```ts
const upfetch = up(fetch, () => ({
   timeout: 5000,
}))
```

### ✔️ 重试

重试功能通过适配器提供，而不是直接集成到核心库中。这种设计选择有助于保持基础包的体积尽可能小，因为许多应用程序并不需要重试功能。

```ts
import { withRetry } from 'up-fetch/adapters'

const upfetch = up(withRetry(fetch), () => ({
   retry: {
      enabled: true,
      times: 3,
      delay: 1000,
   },
}))
```

所有重试选项都可以是函数，以实现精细控制。每个函数都接收一个包含相关信息的上下文对象。

默认行为：

```ts
const upfetch = up(withRetry(fetch), () => ({
   retry: {
      // 对所有非 2XX 响应启用重试
      enabled: ({ response, request }) => !response.ok,
      // 仅对 GET 请求重试一次
      times: ({ response, request }) => (request.method === 'GET' ? 1 : 0),
      // 重试之间的延迟为 1000ms
      delay: 1000,
   },
}))
```

你可以在每个请求的基础上覆盖单个选项：

```ts
await upfetch('/api/data', {
   method: 'DELETE',
   retry: {
      times: 3,
      // 指数退避
      delay: ({ attempt }) => attempt ** 2 * 1000,
   },
})
```

### ✔️ 错误处理

#### 👉 <samp>ResponseError</samp>

当 `response.ok` 为 `false` 时抛出。\
使用 `isResponseError` 识别此错误类型。

```ts
import { isResponseError } from 'up-fetch'

try {
   await upfetch('/todos/1')
} catch (error) {
   if (isResponseError(error)) {
      console.log(error.status)
   }
}
```

-  使用 [parseRejected][api-reference] 选项抛出自定义错误。
-  使用 [reject][api-reference] 选项决定**何时**抛出错误。

#### 👉 <samp>ValidationError</samp>

当模式验证失败时抛出。\
使用 `isValidationError` 识别此错误类型。

```ts
import { isValidationError } from 'up-fetch'

try {
   await upfetch('/todos/1', { schema: todoSchema })
} catch (error) {
   if (isValidationError(error)) {
      console.log(error.issues)
   }
}
```

## ➡️ 使用方法

### ✔️ 身份验证

通过设置默认 header 轻松为所有请求添加身份验证：

```ts
const upfetch = up(fetch, () => ({
   headers: { Authorization: localStorage.getItem('bearer-token') },
}))
```

在每次请求之前从 `localStorage` 获取 bearer token。

### ✔️ 删除默认选项

只需传递 `undefined`：

```ts
upfetch('/todos', {
   signal: undefined,
})
```

### ✔️ 表单数据

从 `form` 获取 FormData。

```ts
const form = document.querySelector('#my-form')

upfetch('/todos', {
   method: 'POST',
   body: new FormData(form),
})
```

或从对象创建 FormData：

```ts
import { serialize } from 'object-to-formdata'

const upfetch = up(fetch, () => ({
   serializeBody: (body) => serialize(body),
}))

upfetch('https://a.b.c', {
   method: 'POST',
   body: { file: new File(['foo'], 'foo.txt') },
})
```

### ✔️ HTTP 代理

由于 _upfetch_ 是 _"fetch 无关的"_，你可以使用 [undici](https://github.com/nodejs/undici) 代替原生 fetch 实现。

在单个请求中：

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

在所有请求中：

```ts
import { fetch, Agent } from 'undici'

const upfetch = up(fetch, () => ({
   dispatcher: new Agent({
      keepAliveTimeout: 10,
      keepAliveMaxTimeout: 10,
   }),
}))
```

### ✔️ 多个 fetch 客户端

你可以创建多个具有不同默认值的 upfetch 实例：

```ts
const fetchJson = up(fetch)

const fetchBlob = up(fetch, () => ({
   parseResponse: (res) => res.blob(),
}))

const fetchText = up(fetch, () => ({
   parseResponse: (res) => res.text(),
}))
```

## ➡️ 高级用法

### ✔️ 错误作为值

虽然 Fetch API 在响应不正常时不会抛出错误，但 _upfetch_ 会抛出 `ResponseError`。

如果你更愿意将错误作为值处理，将 `reject` 设置为返回 `false`。\
这允许你自定义 `parseResponse` 函数以结构化格式返回成功数据和错误响应。

```ts
const upfetch = up(fetch, () => ({
   reject: () => false,
   parseResponse: async (response) => {
      const json = await response.json()
      return response.ok
         ? { data: json, error: null }
         : { data: null, error: json }
   },
}))
```

使用方法：

```ts
const { data, error } = await upfetch('/users/1')
```

### ✔️ 自定义响应解析

默认情况下，_upfetch_ 能够自动解析 `json` 和 `text` 成功响应。

当 `reject` 返回 `false` 时调用 `parseResponse` 方法。
你可以使用该选项解析其他响应类型。

```ts
const upfetch = up(fetch, () => ({
   parseResponse: (response) => response.blob(),
}))
```

💡 注意，只有当 `reject` 返回 `false` 时才会调用 `parseResponse` 方法。

### ✔️ 自定义响应错误

默认情况下，当 `reject` 返回 `true` 时，_upfetch_ 会抛出 `ResponseError`。

如果你想抛出自定义错误，可以向 `parseRejected` 选项传递一个函数。

```ts
const upfetch = up(fetch, () => ({
   parseRejected: async (response) => {
      const status = response.status
      const data = await response.json()
      return new CustomError(status, data)
   },
}))
```

### ✔️ 自定义参数序列化

默认情况下，_upfetch_ 使用 `URLSearchParams` 序列化参数。

你可以通过向 `serializeParams` 选项传递函数来自定义参数序列化。

```ts
import queryString from 'query-string'

const upfetch = up(fetch, () => ({
   serializeParams: (params) => queryString.stringify(params),
}))
```

### ✔️ 自定义请求体序列化

默认情况下，_upfetch_ 使用 `JSON.stringify` 序列化普通对象。

你可以通过向 `serializeBody` 选项传递函数来自定义请求体序列化。它允许你：

-  **限制有效的请求体类型**，通过类型化其第一个参数
-  **将请求体转换**为有效的 `BodyInit` 类型

以下示例展示如何将有效请求体类型限制为 `Record<string, any>` 并使用 `JSON.stringify` 序列化：

```ts
// 将请求体类型限制为 Record<string, any> 并序列化
const upfetch = up(fetch, () => ({
   serializeBody: (body: Record<string, any>) => JSON.stringify(body),
}))

// ❌ 类型错误：请求体不是 Record<string, any>
upfetch('https://a.b.c/todos', {
   method: 'POST',
   body: [['title', 'New Todo']],
})

// ✅ 使用 Record<string, any> 正常工作
upfetch('https://a.b.c/todos', {
   method: 'POST',
   body: { title: 'New Todo' },
})
```

以下示例使用 `superjson` 序列化请求体。有效的请求体类型从 `SuperJSON.stringify` 推断。

```ts
import SuperJSON from 'superjson'

const upfetch = up(fetch, () => ({
   serializeBody: SuperJSON.stringify,
}))
```

### ✔️ 基于请求的默认值

默认选项接收 fetcher 参数，这允许你根据实际请求定制默认值。

```ts
const upfetch = up(fetch, (input, options) => ({
   baseUrl: 'https://example.com/',
   headers: {
      // 仅为受保护路由添加身份验证
      Authorization:
         typeof input === 'string' && input.startsWith('/api/protected/')
            ? `Bearer ${getToken()}`
            : undefined,
   },
   // 仅为公共端点添加跟踪参数
   params: {
      trackingId:
         typeof input === 'string' && input.startsWith('/public/')
            ? crypto.randomUUID()
            : undefined,
   },
   // 为长时间运行的操作增加超时时间
   timeout:
      typeof input === 'string' && input.startsWith('/export/') ? 30000 : 5000,
}))
```

## ➡️ API 参考

### <samp>up(fetch, getDefaultOptions?)</samp>

创建具有可选默认选项的新 upfetch 实例。

```ts
function up(
   fetchFn: typeof globalThis.fetch,
   getDefaultOptions?: (fetcherOptions: FetcherOptions) => DefaultOptions,
): UpFetch
```

| 选项                         | 签名                           | 描述                                                                    |
| ---------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `baseUrl`                    | `string`                       | 所有请求的基础 URL。                                                    |
| `params`                     | `object`                       | 默认查询参数。                                                          |
| `onRequest`                  | `(options) => void`            | 在发出请求之前执行。                                                    |
| `onError`                    | `(error, options) => void`     | 发生错误时执行。                                                        |
| `onSuccess`                  | `(data, options) => void`      | 请求成功完成时执行。                                                    |
| `parseResponse`              | `(response, options) => data`  | 默认成功响应解析器。<br/>如果省略，将自动解析 `json` 和 `text` 响应。   |
| `parseRejected`              | `(response, options) => error` | 默认错误响应解析器。<br/>如果省略，将自动解析 `json` 和 `text` 响应。   |
| `serializeBody`              | `(body) => BodyInit`           | 默认请求体序列化器。<br/>通过类型化其第一个参数限制有效的 `body` 类型。 |
| `serializeParams`            | `(params) => string`           | 默认查询参数序列化器。                                                  |
| `timeout`                    | `number`                       | 默认超时时间（毫秒）。                                                  |
| `reject`                     | `(response) => boolean`        | 决定何时拒绝响应。                                                      |
| _...以及所有其他 fetch 选项_ |                                |                                                                         |

### <samp>upfetch(url, options?)</samp>

使用给定选项发出 fetch 请求。

```ts
function upfetch(
   url: string | URL | Request,
   options?: FetcherOptions,
): Promise<any>
```

选项：

| 选项                         | 签名                           | 描述                                                                                     |
| ---------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `baseUrl`                    | `string`                       | 请求的基础 URL。                                                                         |
| `params`                     | `object`                       | 查询参数。                                                                               |
| `parseResponse`              | `(response, options) => data`  | 成功响应解析器。                                                                         |
| `parseRejected`              | `(response, options) => error` | 错误响应解析器。                                                                         |
| `schema`                     | `StandardSchemaV1`             | 用于验证响应的模式。<br/>模式必须遵循 [Standard Schema Specification][standard-schema]。 |
| `serializeBody`              | `(body) => BodyInit`           | 请求体序列化器。<br/>通过类型化其第一个参数限制有效的 `body` 类型。                      |
| `serializeParams`            | `(params) => string`           | 查询参数序列化器。                                                                       |
| `timeout`                    | `number`                       | 超时时间（毫秒）。                                                                       |
| `reject`                     | `(response) => boolean`        | 决定何时拒绝响应。                                                                       |
| _...以及所有其他 fetch 选项_ |                                |                                                                                          |

<br/>

### <samp>isResponseError(error)</samp>

检查错误是否为 `ResponseError`。

### <samp>isValidationError(error)</samp>

检查错误是否为 `ValidationError`。

### <samp>isJsonifiable(value)</samp>

确定值是否可以安全转换为 `json`。

以下被认为是可 JSON 化的：

-  普通对象
-  数组
-  具有 `toJSON` 方法的类实例

## ➡️ 功能比较

查看[功能比较][comparison]表，了解 _upfetch_ 与其他获取库的比较。

<br/>

## ➡️ 环境支持

-  ✅ 浏览器 (Chrome, Firefox, Safari, Edge)
-  ✅ Node.js (20.3.0+)
-  ✅ Bun
-  ✅ Deno
-  ✅ Cloudflare Workers
-  ✅ Vercel Edge Runtime

<div align="center">
<br />
<br />
<hr/>
<h3>分享到：</h3>

[![s][bsky-badge]][bsky-link]
[![Share on Twitter][tweet-badge]][tweet-link]

<br />
<br />
</div >

<!-- Badges -->

[bsky-badge]: https://img.shields.io/badge/Bluesky-0085ff?logo=bluesky&logoColor=fff
[bsky-link]: https://bsky.app/intent/compose?text=https%3A%2F%2Fgithub.com%2FL-Blondy%2Fup-fetch
[tweet-badge]: https://img.shields.io/badge/Twitter-0f1419?logo=x&logoColor=fff
[tweet-link]: https://twitter.com/intent/tweet?text=https%3A%2F%2Fgithub.com%2FL-Blondy%2Fup-fetch

<!-- links -->

[zod]: https://zod.dev/
[valibot]: https://valibot.dev/
[arktype]: https://arktype.dev/
[standard-schema]: https://github.com/standard-schema/standard-schema
[standard-schema-libs]: https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec
[api-reference]: #️-api-参考
[comparison]: https://github.com/L-Blondy/up-fetch/blob/master/COMPARISON.md
