import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/migrations/*.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["@tsfga/core", "kysely", "pg"],
  tsconfig: "tsconfig.build.json",
});
