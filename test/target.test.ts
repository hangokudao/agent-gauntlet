import test from "node:test";
import assert from "node:assert/strict";
import { assertTargetAllowed, normalizeTarget, TargetError } from "../src/target.js";

test("normalizes localhost without a scheme", () => {
  const target = normalizeTarget("localhost:3000");
  assert.equal(target.url, "http://localhost:3000/");
  assert.equal(target.isLocal, true);
});

test("accepts a full localhost URL", () => {
  const target = normalizeTarget("http://localhost:5173");
  assert.equal(target.url, "http://localhost:5173/");
  assert.equal(target.isLocal, true);
});

test("rejects external targets without a scheme", () => {
  assert.throws(() => normalizeTarget("example.com"), TargetError);
});

test("requires ownership confirmation for external URLs", () => {
  const target = normalizeTarget("https://example.com");
  assert.throws(() => assertTargetAllowed(target, {}), TargetError);
  assert.doesNotThrow(() => assertTargetAllowed(target, { ownsTarget: true }));
});
