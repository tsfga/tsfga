# tests/smoke

Runtime-agnostic smoke test for `@tsfga/core`.

Part of the [tsfga](../../README.md) monorepo.

## Purpose

Validates that the built `@tsfga/core` package can be
imported and used from Node.js and Deno via standard ESM
resolution (package.json `exports`). This catches packaging
issues (missing exports, broken build output) that unit
tests running under Bun would not detect.

## How it works

`smoke-test.mjs` imports `createTsfga` and `check` from
the built `dist/` output, creates a minimal mock
`TupleStore`, and runs two basic checks:

1. Direct tuple match returns `true`
2. Missing tuple returns `false`

The test uses plain `assert()` with no test framework
dependency.

## Running

Build first, then run on either runtime:

```bash
bun run build

# Node.js
node tests/smoke/smoke-test.mjs

# Deno
deno run --allow-all tests/smoke/smoke-test.mjs
```
