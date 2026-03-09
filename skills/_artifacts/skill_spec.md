# up-fetch - Skill Spec

up-fetch is a framework-agnostic fetch client builder for TypeScript. It wraps a fetch implementation with reusable defaults, parsing, validation, retries, timeouts, streaming hooks, and error helpers while keeping a fetch-like call shape.

The skill surface is small but not trivial: most agent failures come from older API versions, frozen dynamic state, overly loose typing, or runtime-specific fetch behavior that looks correct until it is exercised under retries, streaming, or patched globals.

## Domains

| Domain | Description | Skills |
| ------ | ----------- | ------ |
| Configuring reusable clients | Create one reusable client and keep defaults dynamic without mutating the wrong stage of the lifecycle. | create-upfetch-client, add-auth-and-dynamic-defaults |
| Shaping requests | Serialize bodies and params correctly when the defaults are too simple. | customize-serialization-and-request-shape |
| Interpreting server responses | Parse success and error payloads and add runtime validation with the right abstractions. | validate-parse-and-handle-errors |
| Operating requests in production | Make requests resilient and debug them across runtimes, retries, and streaming environments. | configure-retries-timeouts-and-hooks, debug-streaming-and-runtime-fetch |

## Skill Inventory

| Skill | Type | Domain | What it covers | Failure modes |
| ----- | ---- | ------ | -------------- | ------------- |
| create-upfetch-client | core | configuring-reusable-clients | up, baseUrl, default options, request-aware defaults | 4 |
| add-auth-and-dynamic-defaults | core | configuring-reusable-clients | Authorization headers, async token lookup, onRequest(request), clearing defaults | 5 |
| validate-parse-and-handle-errors | core | interpreting-server-responses | schema, parseResponse, parseRejected, reject, ResponseError, ValidationError | 7 |
| customize-serialization-and-request-shape | core | shaping-requests | serializeParams, serializeBody, params/body merge rules, content-type behavior | 7 |
| configure-retries-timeouts-and-hooks | core | operating-requests-in-production | retry, timeout, onRetry, onResponse, lifecycle ordering | 5 |
| debug-streaming-and-runtime-fetch | core | operating-requests-in-production | streaming callbacks, patched fetch, undici, runtime caveats | 5 |

## Failure Mode Inventory

### Create upfetch client (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | ------- | -------- | ------ | ------------ |
| 1 | Pass a function to upfetch | HIGH | v1.3.0 CHANGELOG.md | - |
| 2 | Pass an object to up | CRITICAL | maintainer interview | - |
| 3 | Set a default request body | HIGH | src/tests/body.spec.ts | - |
| 4 | Rewrite URL inside onRequest | HIGH | src/up.ts; issue #63 | add-auth-and-dynamic-defaults |

### Add auth and dynamic defaults (5 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | ------- | -------- | ------ | ------------ |
| 1 | Read token outside the factory | CRITICAL | README.md Authentication; maintainer interview | create-upfetch-client |
| 2 | Use legacy onBeforeFetch signature | HIGH | v1.2.0 CHANGELOG.md; v1.1.0 README.md; issue #52 | - |
| 3 | Clear auth with an empty string | MEDIUM | README.md Delete a default option; src/tests/header.spec.ts | - |
| 4 | Assume browser storage exists everywhere | MEDIUM | README.md Authentication; README.md Environment Support | - |
| 5 | Default to localStorage auth everywhere | MEDIUM | maintainer interview | - |

### Validate, parse, and handle errors (7 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | ------- | -------- | ------ | ------------ |
| 1 | Type responses with generics only | CRITICAL | maintainer interview | - |
| 2 | Expect schema to validate requests | HIGH | README.md API Reference; issue #83 | - |
| 3 | Keep legacy error option names | HIGH | v1.3.5 CHANGELOG.md; v1.3.6 README.md | - |
| 4 | Return error values without disabling reject | HIGH | README.md Advanced Usage / Error as value | - |
| 5 | Expect typed data from bare up(fetch) | MEDIUM | src/types.ts; src/tests/types.spec-d.ts; issue #37 | - |
| 6 | Use pre-Standard-Schema Zod | MEDIUM | README.md Schema Validation; issue #37 | - |
| 7 | Trust any from unschematized calls | HIGH | maintainer interview | - |

### Customize serialization and request shape (7 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | ------- | -------- | ------ | ------------ |
| 1 | Use nested params with defaults | HIGH | src/fallback-options.ts; README.md Custom params serialization; maintainer interview | - |
| 2 | Manually concatenate query strings | MEDIUM | README.md Simple Query Parameters; maintainer interview | - |
| 3 | Define the same param twice | MEDIUM | src/utils.ts; src/tests/params.spec.ts | - |
| 4 | Expect URL params in serializeParams | MEDIUM | src/tests/params.spec.ts | - |
| 5 | Assume serializeBody skips non-JSON bodies | HIGH | v1.3.0 CHANGELOG.md; src/tests/body.spec.ts | - |
| 6 | Call JSON.stringify before upfetch | MEDIUM | README.md Automatic Body Handling; maintainer interview | - |
| 7 | Force JSON content type for FormData | HIGH | src/tests/header.spec.ts; issue #40 | - |

### Configure retries, timeouts, and hooks (5 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | ------- | -------- | ------ | ------------ |
| 1 | Expect retries by default | HIGH | src/fallback-options.ts; README.md Retry | - |
| 2 | Ignore retry error branch | HIGH | README.md Retry on network errors, timeouts, or any other error; src/tests/retry.spec.ts | - |
| 3 | Expect onResponse on every attempt | HIGH | src/tests/on-response.spec.ts; commit 8a60526 | - |
| 4 | Assume callback timing from intuition | HIGH | src/up.ts; tests; maintainer interview | - |
| 5 | Expect parse errors to retry | MEDIUM | src/up.ts | - |

### Debug streaming and runtime fetch behavior (5 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | ------- | -------- | ------ | ------------ |
| 1 | Pass undici fetch to up | CRITICAL | src/tests/undici.spec.ts; issue #49 | - |
| 2 | Capture patched fetch too early | HIGH | maintainer interview | - |
| 3 | Assume totalBytes always exists | MEDIUM | src/tests/on-stream-response.spec.ts; commit 9764f9d | - |
| 4 | Expect upload progress on old WebKit | MEDIUM | src/stream.ts; issue #65 | - |
| 5 | Expect streaming callbacks with empty bodies | MEDIUM | src/tests/on-stream-request.spec.ts; src/tests/on-stream-response.spec.ts | - |

## Tensions

| Tension | Skills | Agent implication |
| ------- | ------ | ----------------- |
| Reuse versus runtime dynamism | create-upfetch-client ↔ add-auth-and-dynamic-defaults | Agents freeze state outside up or rebuild clients unnecessarily. |
| Runtime validation versus quick typing | validate-parse-and-handle-errors ↔ customize-serialization-and-request-shape | Agents prefer fast compile-time types and skip runtime validation or precise serializers. |
| Fetch familiarity versus wrapped lifecycle | create-upfetch-client ↔ configure-retries-timeouts-and-hooks ↔ debug-streaming-and-runtime-fetch | Agents mutate the wrong object or expect hook and retry timing to match generic middleware. |

## Cross-References

| From | To | Reason |
| ---- | -- | ------ |
| create-upfetch-client | add-auth-and-dynamic-defaults | Auth is implemented through the same default-options mechanism that defines the shared client. |
| create-upfetch-client | customize-serialization-and-request-shape | Client-level defaults often need matching serializers to stay correct everywhere. |
| validate-parse-and-handle-errors | configure-retries-timeouts-and-hooks | reject and parseRejected affect which failures retry sees before parsing runs. |
| configure-retries-timeouts-and-hooks | debug-streaming-and-runtime-fetch | Timeouts, aborts, and retries surface differently across runtimes and patched fetch implementations. |
| debug-streaming-and-runtime-fetch | create-upfetch-client | The choice between plain up(fetch) and a dynamic fetch wrapper is made at client creation time. |

## Subsystems & Reference Candidates

| Skill | Subsystems | Reference candidates |
| ----- | ---------- | -------------------- |
| create-upfetch-client | - | - |
| add-auth-and-dynamic-defaults | - | - |
| validate-parse-and-handle-errors | - | - |
| customize-serialization-and-request-shape | - | serialization and merge rules |
| configure-retries-timeouts-and-hooks | - | request and response lifecycle ordering |
| debug-streaming-and-runtime-fetch | - | - |

## Recommended Skill File Structure

- **Core skills:** create-upfetch-client, add-auth-and-dynamic-defaults, validate-parse-and-handle-errors, customize-serialization-and-request-shape, configure-retries-timeouts-and-hooks, debug-streaming-and-runtime-fetch
- **Framework skills:** none from the local docs and source
- **Lifecycle skills:** none; the maintainer asked to keep the surface simple rather than add journey skills
- **Composition skills:** none; React Query follows normal TanStack Query patterns and does not need a dedicated skill
- **Reference files:** customize-serialization-and-request-shape, configure-retries-timeouts-and-hooks

## Composition Opportunities

| Library | Integration points | Composition skill needed? |
| ------- | ------------------ | ------------------------- |
| @tanstack/react-query | Using up-fetch as the fetcher inside query functions and aligning error/typing expectations | Open question |
