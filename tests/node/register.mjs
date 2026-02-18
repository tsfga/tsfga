/**
 * Registration entry point for node --import. Registers the bun:test
 * ESM loader for import redirection. TypeScript transpilation is handled
 * separately via --import tsx in the node command.
 */

import { register } from "node:module";

register("./loader.mjs", import.meta.url);
