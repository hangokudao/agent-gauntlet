import type { AgentResult, Finding, Severity } from "./types.js";

const severities = new Set<Severity>(["info", "low", "medium", "high"]);

export function validateAgentPayload(payload: unknown, agentName: string): AgentResult {
  const object = requireRecord(payload, "agent result");
  const notes = requireString(object.notes, "notes");
  const rawFindings = Array.isArray(object.findings) ? object.findings : [];

  return {
    agentName,
    status: "completed",
    notes,
    findings: rawFindings.map((finding, index) => validateFinding(finding, index))
  };
}

export function validateFinding(payload: unknown, index = 0): Finding {
  const object = requireRecord(payload, `finding ${index + 1}`);
  const severity = requireString(object.severity, `finding ${index + 1}.severity`);
  if (!severities.has(severity as Severity)) {
    throw new Error(`finding ${index + 1}.severity must be info, low, medium, or high.`);
  }

  const reproductionSteps = object.reproductionSteps;
  if (!Array.isArray(reproductionSteps) || reproductionSteps.length === 0) {
    throw new Error(`finding ${index + 1}.reproductionSteps must contain at least one step.`);
  }

  return {
    title: requireString(object.title, `finding ${index + 1}.title`),
    severity: severity as Severity,
    category: requireString(object.category, `finding ${index + 1}.category`),
    target: requireString(object.target, `finding ${index + 1}.target`),
    reproductionSteps: reproductionSteps.map((step, stepIndex) =>
      requireString(step, `finding ${index + 1}.reproductionSteps[${stepIndex}]`)
    ),
    evidence: requireString(object.evidence, `finding ${index + 1}.evidence`),
    recommendation: requireString(object.recommendation, `finding ${index + 1}.recommendation`)
  };
}

function requireRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value.trim();
}
