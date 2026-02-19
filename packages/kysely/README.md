# @tsfga/kysely

Kysely/PostgreSQL adapter for
[`@tsfga/core`](../core/README.md).

Part of the [tsfga](../../README.md) monorepo. Implements
the `TupleStore` interface from `@tsfga/core` using
[Kysely](https://kysely.dev/) for PostgreSQL.

## Installation

```bash
npm install @tsfga/kysely @tsfga/core kysely pg
```

## Quick start

```typescript
import { createTsfga } from "@tsfga/core";
import { KyselyTupleStore } from "@tsfga/kysely";
import { Kysely, PostgresDialect } from "kysely";
import Pool from "pg-pool";

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: "..." }),
  }),
});

const store = new KyselyTupleStore(db);
const fga = createTsfga(store);

// Now use fga.check(), fga.addTuple(), etc.
```

## Migrations

The package ships with Kysely migrations under
`src/migrations/`. Apply them using `kysely-ctl` or
programmatically:

```typescript
import { Migrator, FileMigrationProvider } from "kysely";
import { promises as fs } from "node:fs";
import * as path from "node:path";

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(
      require.resolve("@tsfga/kysely"),
      "../../src/migrations",
    ),
  }),
});

await migrator.migrateToLatest();
```

## Schema

Migrations create a `tsfga` schema with three tables:

| Table | Description |
|---|---|
| `tsfga.tuples` | Relationship tuples with optional conditions |
| `tsfga.relation_configs` | Relation definitions (implied_by, computed_userset, etc.) |
| `tsfga.condition_definitions` | Named CEL condition expressions |

## License

MIT
