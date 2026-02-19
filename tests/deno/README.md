# tests/deno

`bun:test` compatibility shim for Deno.

Part of the [tsfga](../../README.md) monorepo.

## Purpose

Test files in this project use `import from "bun:test"`
exclusively. This directory provides a `deno.json` import
map that remaps `"bun:test"` to a local shim built on
`@std/testing/bdd` + `@std/expect`.

This allows the same test files to run on Deno without
modification.

## How it works

```
import "bun:test"  →  import map  →  bun-test-shim.ts
```

- **`deno.json`** — import map that redirects `"bun:test"`
  to the local shim; also maps npm dependencies and
  enables `nodeModulesDir: "auto"` for resolution from
  the existing `node_modules/`
- **`bun-test-shim.ts`** — re-exports `@std/testing/bdd`
  and `@std/expect` with a `describe` wrapper that
  disables Deno's resource/op sanitizers (avoids
  false-positive leak detection from npm packages like
  `pg`)

## Supported API

`describe`, `test`, `beforeEach`, `afterEach`, `beforeAll`,
`afterAll`, and `expect()` with matchers: `toBe`,
`toBeNull`, `toEqual`, `toHaveLength`, `toBeTruthy`,
`toBeInstanceOf`, `not.toBeNull`, `not.toBe`, and
`rejects.toBeInstanceOf`.

## Running

From the repo root:

```bash
bun run turbo:test:deno
```

Or directly:

```bash
deno test --allow-all \
  --config ../../tests/deno/deno.json tests/
```
