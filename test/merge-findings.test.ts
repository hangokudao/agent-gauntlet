import test from "node:test";
import assert from "node:assert/strict";
import { mergeFindings } from "../src/report/merge-findings.js";
import type { AgentResult } from "../src/types.js";

test("merges duplicate findings and preserves highest severity", () => {
  const results: AgentResult[] = [
    {
      agentName: "a",
      status: "completed",
      notes: "first",
      findings: [
        {
          title: "Missing CSP",
          severity: "low",
          category: "security-header",
          target: "https://example.test/",
          reproductionSteps: ["Check header"],
          evidence: "missing",
          recommendation: "add csp"
        }
      ]
    },
    {
      agentName: "b",
      status: "completed",
      notes: "second",
      findings: [
        {
          title: "missing csp",
          severity: "medium",
          category: "security-header",
          target: "https://example.test/",
          reproductionSteps: ["Check header"],
          evidence: "missing",
          recommendation: "add csp"
        }
      ]
    }
  ];

  const merged = mergeFindings(results);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, "GNT-001");
  assert.equal(merged[0].severity, "medium");
  assert.equal(merged[0].sourceAgent, "a, b");
});
