import type { AgentResult, Finding } from "../types.js";

export function mergeFindings(results: AgentResult[]): Finding[] {
  const merged = new Map<string, Finding>();

  for (const result of results) {
    for (const finding of result.findings) {
      const key = findingKey(finding);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, { ...finding, sourceAgent: finding.sourceAgent ?? result.agentName });
        continue;
      }

      existing.severity = maxSeverity(existing.severity, finding.severity);
      existing.sourceAgent = mergeSourceAgents(existing.sourceAgent, finding.sourceAgent ?? result.agentName);
    }
  }

  return Array.from(merged.values()).map((finding, index) => ({
    ...finding,
    id: finding.id ?? `GNT-${String(index + 1).padStart(3, "0")}`
  }));
}

function findingKey(finding: Finding): string {
  return [
    normalize(finding.title),
    normalize(finding.target),
    normalize(finding.reproductionSteps.join(" "))
  ].join("|");
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function maxSeverity(a: Finding["severity"], b: Finding["severity"]): Finding["severity"] {
  const order = ["info", "low", "medium", "high"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

function mergeSourceAgents(a: string | undefined, b: string): string {
  const parts = new Set((a ? a.split(", ") : []).concat(b));
  return Array.from(parts).sort().join(", ");
}
