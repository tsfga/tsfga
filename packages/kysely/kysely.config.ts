import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PostgresDialect } from "kysely";
import { defineConfig } from "kysely-ctl";
import pg from "pg";

// Load root .env since kysely-ctl runs from packages/kysely/
const envPath = resolve(import.meta.dirname ?? ".", "../../.env");
try {
  const envText = readFileSync(envPath, "utf-8");
  for (const line of envText.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
} catch {
  // .env not found — rely on existing env vars
}

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    }),
  }),
  migrations: {
    migrationFolder: "src/migrations",
  },
});
