# tests/node

`bun:test` compatibility shim for Node.js.

Part of the [tsfga](../../README.md) monorepo.

## Purpose

Test files in this project use `import from "bun:test"`
exclusively. This directory provides a custom ESM loader
that intercepts `"bun:test"` imports and redirects them to
a compatibility shim built on `node:test` + `node:assert`.

This allows the same test files to run on Node.js without
modification.

## How it works

```
import "bun:test"  →  ESM loader hook  →  bun-test-shim.mjs
```

- **`register.mjs`** — entry point for `node --import`;
  registers the ESM loader
- **`loader.mjs`** — ESM resolve hook that redirects
  `"bun:test"` to the local shim
- **`bun-test-shim.mjs`** — implements the `bun:test` API
  subset using `node:test` + `node:assert/strict`

## Supported API

`describe`, `test`, `beforeEach`, `afterEach`, `beforeAll`,
`afterAll`, and `expect()` with matchers: `toBe`,
`toBeNull`, `toEqual`, `toHaveLength`, `toBeTruthy`,
`toBeInstanceOf`, `not.toBeNull`, `not.toBe`, and
`rejects.toBeInstanceOf`.

## Running

From the repo root (requires `tsx` for TypeScript
transpilation):

```bash
bun run turbo:test:node
```

Or directly:

```bash
node --import tsx --import ./tests/node/register.mjs \
  --test 'packages/core/tests/*.test.ts'
```
