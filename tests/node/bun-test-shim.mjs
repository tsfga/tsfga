/**
 * Compatibility shim that implements the bun:test API subset used by this
 * project on top of node:test + node:assert/strict. Loaded via the custom
 * ESM loader in loader.mjs so that test files importing "bun:test" resolve
 * here when running under Node.js.
 */

import { strict as assert } from "node:assert";
import { after, before, beforeEach, afterEach, describe, test } from "node:test";

const beforeAll = before;
const afterAll = after;

function expect(actual) {
  const matchers = {
    toBe(expected) {
      assert.strictEqual(actual, expected);
    },
    toBeNull() {
      assert.strictEqual(actual, null);
    },
    toEqual(expected) {
      assert.deepStrictEqual(actual, expected);
    },
    toHaveLength(n) {
      assert.strictEqual(actual.length, n);
    },
    toBeTruthy() {
      assert.ok(actual);
    },
    toBeInstanceOf(ctor) {
      assert.ok(
        actual instanceof ctor,
        `Expected instance of ${ctor.name}, got ${actual?.constructor?.name}`,
      );
    },
    not: {
      toBeNull() {
        assert.notStrictEqual(actual, null);
      },
      toBe(expected) {
        assert.notStrictEqual(actual, expected);
      },
    },
    rejects: {
      async toBeInstanceOf(ctor) {
        await assert.rejects(actual, (err) => err instanceof ctor);
      },
    },
  };
  return matchers;
}

export { describe, test, beforeEach, afterEach, beforeAll, afterAll, expect };
