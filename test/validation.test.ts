import test from "node:test";
import assert from "node:assert/strict";
import { validateAgentPayload } from "../src/validation.js";

test("validates structured agent payloads", () => {
  const result = validateAgentPayload(
    {
      notes: "Checked the app.",
      findings: [
        {
          title: "Missing CSP",
          severity: "low",
          category: "security-header",
          target: "http://localhost:3000/",
          reproductionSteps: ["Request the homepage"],
          evidence: "Header was absent",
          recommendation: "Add a CSP header"
        }
      ]
    },
    "security-reviewer"
  );

  assert.equal(result.status, "completed");
  assert.equal(result.findings.length, 1);
});

test("rejects invalid structured agent payloads", () => {
  assert.throws(
    () =>
      validateAgentPayload(
        {
          notes: "Bad finding",
          findings: [
            {
              title: "Missing repro",
              severity: "critical",
              category: "security",
              target: "http://localhost:3000/",
              reproductionSteps: [],
              evidence: "none",
              recommendation: "fix it"
            }
          ]
        },
        "security-reviewer"
      ),
    /severity/
  );
});

test("requires findings to be an array", () => {
  assert.throws(
    () => validateAgentPayload({ notes: "Checked the app." }, "security-reviewer"),
    /findings must be an array/
  );
  assert.throws(
    () => validateAgentPayload({ notes: "Checked the app.", findings: {} }, "security-reviewer"),
    /findings must be an array/
  );
});

test("rejects fields excluded by the strict output schema", () => {
  assert.throws(
    () =>
      validateAgentPayload(
        { notes: "Checked the app.", findings: [], debug: "unexpected" },
        "security-reviewer"
      ),
    /agent result contains unexpected field "debug"/
  );

  assert.throws(
    () =>
      validateAgentPayload(
        {
          notes: "Checked the app.",
          findings: [
            {
              title: "Missing CSP",
              severity: "low",
              category: "security-header",
              target: "http://localhost:3000/",
              reproductionSteps: ["Request the homepage"],
              evidence: "Header was absent",
              recommendation: "Add a CSP header",
              debug: "unexpected"
            }
          ]
        },
        "security-reviewer"
      ),
    /finding 1 contains unexpected field "debug"/
  );
});
