import type { AgentProvider } from "./provider.js";
import type { AgentResult, Finding } from "../types.js";

export class StubProvider implements AgentProvider {
  async runAgent(input: Parameters<AgentProvider["runAgent"]>[0]): Promise<AgentResult> {
    const findings: Finding[] = [];
    const notes: string[] = [
      `Agent: ${input.agent.name}`,
      `Target: ${input.target.url}`,
      `Scenario: ${input.scenario}`,
      `Mode: ${input.mode}`,
      "",
      "This stub provider is intentionally conservative. It prepares auditable agent output and performs only passive checks."
    ];

    if (input.agent.name === "security-reviewer") {
      const securityResult = await passiveSecurityCheck(input.target.url);
      findings.push(...securityResult.findings);
      notes.push(...securityResult.notes);
    } else if (input.agent.name === "browser-chaos-user") {
      notes.push("Manual follow-up: exercise navigation, forms, empty states, and hostile text input in a browser session.");
    } else if (input.agent.name === "data-integrity-reviewer") {
      notes.push("Manual follow-up: verify that user-scoped data cannot be read, overwritten, or deleted across accounts.");
    } else if (input.agent.name === "test-writer") {
      notes.push("Manual follow-up: convert confirmed findings into regression tests before shipping fixes.");
    }

    if (input.mode === "mutation") {
      notes.push("Mutation mode selected: use disposable test accounts and resettable data before applying data-changing checks.");
    }

    if (input.mode === "stress") {
      notes.push("Stress mode selected: keep request volume bounded and verify rate limits without unbounded load.");
    }

    if (input.browserObservation.enabled) {
      notes.push(`Browser observation visited ${input.browserObservation.pagesVisited.length} page(s).`);
      findings.push(...browserFindings(input.browserObservation, input.target.url));
    }

    return {
      agentName: input.agent.name,
      status: "completed",
      notes: notes.join("\n"),
      findings: findings.map((finding) => ({
        ...finding,
        sourceAgent: input.agent.name
      }))
    };
  }
}

function browserFindings(observation: { consoleErrors: string[]; status: string }, target: string): Finding[] {
  if (observation.status !== "completed" || observation.consoleErrors.length === 0) {
    return [];
  }

  return [
    {
      title: "Browser console errors were observed",
      severity: "low",
      category: "browser-runtime",
      target,
      reproductionSteps: ["Run Agent Gauntlet with --browser and inspect the browser observation notes."],
      evidence: observation.consoleErrors.slice(0, 3).join(" | "),
      recommendation: "Open the app in a browser, reproduce the console errors, and fix the underlying runtime issue."
    }
  ];
}

async function passiveSecurityCheck(url: string): Promise<{ notes: string[]; findings: Finding[] }> {
  const notes: string[] = [];
  const findings: Finding[] = [];

  try {
    const response = await fetch(url, { redirect: "manual" });
    notes.push(`Fetched ${url} and received HTTP ${response.status}.`);

    addMissingHeaderFinding(findings, response, {
      header: "content-security-policy",
      title: "Missing Content-Security-Policy header",
      recommendation: "Add a narrow Content-Security-Policy that matches the app's script, style, image, and connection needs."
    });
    addMissingHeaderFinding(findings, response, {
      header: "x-frame-options",
      title: "Missing X-Frame-Options header",
      recommendation: "Add X-Frame-Options or an equivalent frame-ancestors CSP directive if the app should not be framed."
    });
    addMissingHeaderFinding(findings, response, {
      header: "referrer-policy",
      title: "Missing Referrer-Policy header",
      recommendation: "Add a Referrer-Policy such as strict-origin-when-cross-origin."
    });

    if (new URL(url).protocol === "https:") {
      addMissingHeaderFinding(findings, response, {
        header: "strict-transport-security",
        title: "Missing Strict-Transport-Security header",
        recommendation: "Add Strict-Transport-Security after confirming all subdomains are HTTPS-ready."
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    findings.push({
      title: "Target was not reachable",
      severity: "info",
      category: "availability",
      target: url,
      reproductionSteps: [`Request ${url}`],
      evidence: message,
      recommendation: "Start the local app or verify the URL, then run the gauntlet again."
    });
    notes.push(`Fetch failed: ${message}`);
  }

  return { notes, findings };
}

function addMissingHeaderFinding(
  findings: Finding[],
  response: Response,
  input: { header: string; title: string; recommendation: string }
): void {
  if (response.headers.has(input.header)) {
    return;
  }

  findings.push({
    title: input.title,
    severity: "low",
    category: "security-header",
    target: response.url || "target",
    reproductionSteps: [`Request the target URL and inspect the ${input.header} response header.`],
    evidence: `${input.header} header was not present in the HTTP response.`,
    recommendation: input.recommendation
  });
}
