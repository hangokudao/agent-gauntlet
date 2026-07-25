import type { AgentProvider } from "./provider.js";

export function buildOpenAIRequest(
  model: string,
  input: Parameters<AgentProvider["runAgent"]>[0]
) {
  return {
    model,
    input: [
      {
        role: "system",
        content: systemPrompt()
      },
      {
        role: "user",
        content: userPrompt(input)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "agent_gauntlet_result",
        strict: true,
        schema: resultSchema()
      }
    }
  };
}

function systemPrompt(): string {
  return [
    "You are an authorized application-testing agent inside Agent Gauntlet.",
    "Return only JSON matching the provided schema.",
    "Never recommend testing third-party targets without authorization.",
    "Do not perform or propose destructive actions outside the selected run mode.",
    "Every finding must be concrete, reproducible, and evidence-backed."
  ].join("\n");
}

function userPrompt(input: Parameters<AgentProvider["runAgent"]>[0]): string {
  return [
    `Agent name: ${input.agent.name}`,
    `Target URL: ${input.target.url}`,
    `Run mode: ${input.mode}`,
    `Scenario: ${input.scenario}`,
    "",
    "Run mode rules:",
    "- safe: passive checks, non-destructive browsing, and no data-changing actions.",
    "- mutation: allowed to propose test-account create/update/delete flows for disposable targets.",
    "- stress: allowed to propose bounded rate-limit and availability checks, never unbounded load.",
    "",
    "Agent prompt:",
    input.agent.prompt,
    "",
    "Scenario instructions:",
    input.scenarioInstructions,
    "",
    "Browser observation:",
    JSON.stringify(input.browserObservation, null, 2),
    "",
    "Return notes plus findings. If evidence is weak, put it in notes instead of findings."
  ].join("\n");
}

function resultSchema() {
  const findingSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      severity: { type: "string", enum: ["info", "low", "medium", "high"] },
      category: { type: "string" },
      target: { type: "string" },
      reproductionSteps: {
        type: "array",
        minItems: 1,
        items: { type: "string" }
      },
      evidence: { type: "string" },
      recommendation: { type: "string" }
    },
    required: ["title", "severity", "category", "target", "reproductionSteps", "evidence", "recommendation"]
  };

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      notes: { type: "string" },
      findings: {
        type: "array",
        items: findingSchema
      }
    },
    required: ["notes", "findings"]
  };
}
