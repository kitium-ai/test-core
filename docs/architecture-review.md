# Test Core Package Review

This document evaluates `@kitiumai/test-core` against patterns common in mature internal libraries at large tech companies and highlights improvements to increase API consistency, composability, and consumer ergonomics.

## Strengths
- **Single entry point:** `src/index.ts` consolidates exports across logging, configuration, data generation, mocks, and async utilities, keeping onboarding simple.【F:src/index.ts†L7-L20】
- **Environment-aware configuration:** The `ConfigManager` loads defaults and environment overrides so tests adapt between local and CI runs without extra wiring.【F:src/config/index.ts†L16-L70】
- **Test-focused logging:** The `TestLoggerWrapper` provides in-memory capture of structured logs, enabling assertions on log output without external sinks.【F:src/logger/index.ts†L38-L127】

## Gaps Compared to Big-Tech-Grade Libraries
1. **Entry point clarity and tree-shakeability:** The root export mixes broad `export *` statements with selective exports, which can make tree shaking less predictable and can hide breaking changes when internal modules gain new exports.【F:src/index.ts†L7-L20】 Mature libraries typically expose a stable public surface (`index` or `core`) and keep internal modules private.
2. **Configurability contract:** `ConfigManager` exposes getters/setters without validation, schema, or immutability guarantees. Larger teams often use typed schemas with defaulting/validation at load time and a frozen public config to avoid accidental mutation during tests.【F:src/config/index.ts†L16-L80】
3. **Observability consistency:** Logger context is partially normalized (trace IDs), but log retrieval uses lowercased level filtering while levels are stored as strings; the behavior is implicit and not documented. Enterprise test cores provide explicit enums, typed filters, and deterministic ordering for log assertions.【F:src/logger/index.ts†L38-L127】
4. **Documentation depth:** README highlights utilities but lacks package-level guides on composition (e.g., wiring config + logger + data generators) and usage patterns for common frameworks (Playwright, Vitest, Jest). Teams at scale provide opinionated recipes and migration guides to keep usage consistent.
5. **Testing surface guarantees:** There is no contract test (e.g., exported surface snapshot) to prevent accidental breaking changes when adding/removing exports. Big tech packages often pin public API via `api-extractor` reports or snapshot tests.

## Recommended Improvements
- **Define an explicit public API contract:** Replace wildcard exports with curated named exports and document them as stable. Consider introducing `src/public.ts` that re-exports only supported symbols, leaving internal helpers unexported for tree-shakeability and forward compatibility.【F:src/index.ts†L7-L20】
- **Adopt schema-driven configuration:** Introduce a lightweight schema (e.g., `zod` or custom validation) that validates and coerces environment inputs, and expose a read-only `getAll()` snapshot to avoid mid-test mutation. This reduces flaky behavior and aligns with internal config services common in large orgs.【F:src/config/index.ts†L16-L80】
- **Harden logging ergonomics:** Normalize log levels with an enum for retrieval, document stored shape, and add ordering guarantees (e.g., timestamp-sort) so assertions are deterministic. Provide helpers like `expectLogs({ level, contains })` to mirror testing patterns in mature SDKs.【F:src/logger/index.ts†L38-L127】
- **Add framework-oriented guides:** Extend the README (or create `docs/recipes/`) with examples for Jest, Vitest, and Playwright that show configuring globals, setting up logger fixtures, and using data factories. This mirrors the playbook-style docs big tech teams rely on to standardize test setup.
- **Protect the public surface:** Add an API report or snapshot test that records exported members, preventing accidental API drift. Tools like `ts-prune` or `api-extractor` can automate this and keep consumers confident about semver stability.
- **Bundle strategy for consumers:** Publish dual ESM/CJS builds with explicit `exports` map in `package.json` and `types` entry to improve IDE DX and avoid resolution ambiguity for different bundlers.

## Quick Wins
- Start with a `public.ts` barrel and update `package.json#exports` to expose only that entry.
- Add a `ConfigSchema` with defaults and validation, and change `ConfigManager` to freeze the merged config once initialized.
- Document log retrieval semantics and add a `getLogs({ level, after })` signature to support deterministic assertions in parallel tests.

These steps will make the package feel closer to the predictable, well-documented foundations used inside large product companies, while keeping the current feature set intact.
