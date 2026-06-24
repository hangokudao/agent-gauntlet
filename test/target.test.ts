import test from "node:test";
import assert from "node:assert/strict";
import { assertModeAllowed, assertTargetAllowed, normalizeTarget, TargetError } from "../src/target.js";

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
  assert.throws(() => normalizeTarget("example.test"), TargetError);
});

test("requires ownership confirmation for external URLs", () => {
  const target = normalizeTarget("https://example.test");
  assert.throws(() => assertTargetAllowed(target, {}), TargetError);
  assert.doesNotThrow(() => assertTargetAllowed(target, { ownsTarget: true }));
});

test("allows external URLs when hostname is allowlisted", () => {
  const target = normalizeTarget("https://example.test");
  assert.doesNotThrow(() => assertTargetAllowed(target, { allowedHosts: ["example.test"] }));
});

test("mode safety defaults are conservative", () => {
  const local = normalizeTarget("localhost:3000");
  const external = normalizeTarget("https://example.test");

  assert.doesNotThrow(() => assertModeAllowed(local, "mutation", {}));
  assert.throws(() => assertModeAllowed(external, "mutation", {}), TargetError);
  assert.throws(() => assertModeAllowed(local, "stress", {}), TargetError);
  assert.doesNotThrow(() => assertModeAllowed(local, "stress", { allowStress: true }));
});
