import type { AgentResult, BrowserObservation, Finding, RunMode, TargetInfo } from "../types.js";

export function renderMarkdownReport(input: {
  runId: string;
  target: TargetInfo;
  scenario: string;
  mode: RunMode;
  dryRun: boolean;
  findings: Finding[];
  results: AgentResult[];
  browserObservation: BrowserObservation;
}): string {
  const severityCounts = countBySeverity(input.findings);
  const lines = [
    `# Agent Gauntlet Report: ${input.runId}`,
    "",
    `- Target: ${input.target.url}`,
    `- Scenario: ${input.scenario}`,
    `- Mode: ${input.mode}`,
    `- Execution: ${input.dryRun ? "dry-run" : "agent-provider"}`,
    `- Findings: ${input.findings.length}`,
    `- Severity summary: high ${severityCounts.high}, medium ${severityCounts.medium}, low ${severityCounts.low}, info ${severityCounts.info}`,
    "",
    "## Browser Observation",
    "",
    `- Status: ${input.browserObservation.status}`,
    `- Pages visited: ${input.browserObservation.pagesVisited.length}`,
    `- Console errors: ${input.browserObservation.consoleErrors.length}`,
    "",
    input.browserObservation.notes,
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

function countBySeverity(findings: Finding[]): Record<Finding["severity"], number> {
  return findings.reduce(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    { info: 0, low: 0, medium: 0, high: 0 }
  );
}
