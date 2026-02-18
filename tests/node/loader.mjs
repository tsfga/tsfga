/**
 * Node.js ESM resolve hook that intercepts "bun:test" imports and redirects
 * them to the local compatibility shim.
 */

const shimUrl = new URL("./bun-test-shim.mjs", import.meta.url).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier === "bun:test") {
    return { url: shimUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
