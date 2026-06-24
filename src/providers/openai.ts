import type { AgentProvider } from "./provider.js";
import { validateAgentPayload } from "../validation.js";

interface OpenAIProviderOptions {
  model: string;
}

export class OpenAIProvider implements AgentProvider {
  constructor(private readonly options: OpenAIProviderOptions) {}

  async runAgent(input: Parameters<AgentProvider["runAgent"]>[0]) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when provider is openai.");
    }

    const response = await fetch(openaiEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? this.options.model,
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
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed with HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const text = extractOutputText(data);
    return validateAgentPayload(JSON.parse(text), input.agent.name);
  }
}

function openaiEndpoint(): string {
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com";
  return `${baseUrl.replace(/\/$/, "")}/v1/responses`;
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

function extractOutputText(data: unknown): string {
  const outputText = (data as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") {
    return outputText;
  }

  const output = (data as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    throw new Error("OpenAI response did not include output_text or output.");
  }

  const textParts: string[] = [];
  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const part of content) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") {
        textParts.push(text);
      }
    }
  }

  if (!textParts.length) {
    throw new Error("OpenAI response did not include textual content.");
  }
  return textParts.join("\n");
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
