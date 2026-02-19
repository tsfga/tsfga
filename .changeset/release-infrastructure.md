---
"@tsfga/core": minor
"@tsfga/kysely": minor
---

Initial public release.

### @tsfga/core

- 5-step recursive check algorithm compatible with OpenFGA
  (direct tuples, userset expansion, relation inheritance,
  computed usersets, tuple-to-userset)
- CEL condition evaluation on relationship tuples
- Contextual tuples (ephemeral client-side overlay)
- Exclusion (`but not`) and intersection (`and`) operators
- Wildcard subject matching for public access
- Multiple tuple-to-userset paths per relation
- Database-agnostic `TupleStore` interface
- `list_objects` and `list_subjects` queries

### @tsfga/kysely

- `KyselyTupleStore`: PostgreSQL adapter implementing
  the `TupleStore` interface from `@tsfga/core`
- Kysely DDL migrations for the `tsfga` schema
- Type-safe queries via Kysely query builder (no raw SQL)
- Native PostgreSQL UUID storage
- Upsert semantics for tuples, configs, and conditions
