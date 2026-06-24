import type { AgentResult, Finding, TargetInfo } from "../types.js";

export function renderMarkdownReport(input: {
  runId: string;
  target: TargetInfo;
  scenario: string;
  dryRun: boolean;
  findings: Finding[];
  results: AgentResult[];
}): string {
  const lines = [
    `# Agent Gauntlet Report: ${input.runId}`,
    "",
    `- Target: ${input.target.url}`,
    `- Scenario: ${input.scenario}`,
    `- Mode: ${input.dryRun ? "dry-run" : "stub-provider"}`,
    `- Findings: ${input.findings.length}`,
    "",
    "## Findings",
    ""
  ];

  if (input.findings.length === 0) {
    lines.push("No findings were produced by this run.", "");
  } else {
    for (const finding of input.findings) {
      lines.push(
        `### ${finding.id}: ${finding.title}`,
        "",
        `- Severity: ${finding.severity}`,
        `- Category: ${finding.category}`,
        `- Target: ${finding.target}`,
        `- Source agent: ${finding.sourceAgent ?? "unknown"}`,
        "",
        "Reproduction:",
        ...finding.reproductionSteps.map((step, index) => `${index + 1}. ${step}`),
        "",
        `Evidence: ${finding.evidence}`,
        "",
        `Recommendation: ${finding.recommendation}`,
        ""
      );
    }
  }

  lines.push("## Agent Notes", "");
  for (const result of input.results) {
    lines.push(`### ${result.agentName}`, "", `Status: ${result.status}`, "", result.notes.trim(), "");
  }

  return lines.join("\n");
}
