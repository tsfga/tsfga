# tsfga

TypeScript implementation of OpenFGA-compatible relationship-based access
control (ReBAC).

## Features

- **5-step recursive check algorithm** — direct tuples, userset expansion,
  relation inheritance, computed usersets, and tuple-to-userset
- **CEL condition evaluation** — conditional tuple access via
  `@marcbachmann/cel-js`
- **Database-agnostic core** — the check algorithm depends only on a `TupleStore`
  interface
- **Kysely adapter** — PostgreSQL implementation included out of the box
- **Conformance-tested** — validated against a real OpenFGA service to ensure
  identical results

## Architecture

```
createTsfga (public API)
  ↓
check / conditions (core algorithm)
  ↓
TupleStore (interface)
  ↓
KyselyTupleStore (adapter)
```

The `@tsfga/core` package contains pure logic with no database dependencies.
It communicates with storage through the `TupleStore` interface, which the
`@tsfga/kysely` adapter implements for PostgreSQL.

## Installation

```bash
# Core library (check algorithm, types, conditions)
npm install @tsfga/core

# PostgreSQL adapter (requires Kysely and pg as peer deps)
npm install @tsfga/kysely kysely pg
```

## Quick start

```typescript
import { createTsfga } from "@tsfga/core";
import { KyselyTupleStore } from "@tsfga/kysely";
import { Kysely, PostgresDialect } from "kysely";
import Pool from "pg-pool";

const db = new Kysely({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString: "..." }) }),
});

const store = new KyselyTupleStore(db);
const fga = createTsfga(store);

// Write relation configs (typically derived from your authorization model)
await fga.writeRelationConfig({
  objectType: "document",
  relation: "viewer",
  directlyAssignableTypes: ["user"],
  allowsUsersetSubjects: false,
});

// Add a tuple
await fga.addTuple({
  objectType: "document",
  objectId: "550e8400-e29b-41d4-a716-446655440000",
  relation: "viewer",
  subjectType: "user",
  subjectId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
});

// Check access
const allowed = await fga.check({
  objectType: "document",
  objectId: "550e8400-e29b-41d4-a716-446655440000",
  relation: "viewer",
  subjectType: "user",
  subjectId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
});
// → true
```

## API

`createTsfga(store, options?)` returns an `TsfgaClient` with the following methods:

| Method | Description |
|---|---|
| `check(request)` | Check if a subject has a relation on an object |
| `addTuple(request)` | Insert or update a relationship tuple |
| `removeTuple(request)` | Delete a relationship tuple |
| `listObjects(objectType, relation, subjectType, subjectId)` | List object IDs the subject can access |
| `listSubjects(objectType, objectId, relation)` | List direct subjects for an object + relation |
| `writeRelationConfig(config)` | Insert or update a relation configuration |
| `deleteRelationConfig(objectType, relation)` | Delete a relation configuration |
| `writeConditionDefinition(condition)` | Insert or update a CEL condition definition |
| `deleteConditionDefinition(name)` | Delete a CEL condition definition |

## Development

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [Docker](https://www.docker.com/) (for integration and conformance tests)

### Commands

```bash
bun install                            # Install dependencies
bun run infra:setup                    # Start services + run migrations
bun run turbo:test                     # Run all tests (infra must be running)
bun run turbo:test:core                # Unit tests only (no infra needed)
bun run turbo:test:conformance         # Conformance tests (infra required)
bun run turbo:test:kysely              # Adapter tests (infra required)
bun run turbo:test:node                # Core tests on Node.js (no infra needed)
bun run turbo:test:deno                # Core tests on Deno (no infra needed)
bun run build                          # Build all packages
bun run tsc                            # Type check all packages
bun run biome:check                    # Lint + format check (Biome)
bun run biome:lint                     # Lint only (Biome)
bun run biome:format                   # Auto-format (Biome)
```

### Infrastructure

```bash
bun run infra:setup           # Start services + run migrations (first time)
bun run infra:up              # Start PostgreSQL + OpenFGA
bun run infra:down            # Tear down with volumes (clean slate)
```

PostgreSQL and OpenFGA share the same database instance but use separate schemas
(`tsfga` and `openfga` respectively).
