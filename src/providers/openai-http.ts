import type { ResolvedOpenAIConfig } from "./openai-config.js";

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export async function postOpenAIResponse(
  config: ResolvedOpenAIConfig,
  request: unknown,
  fetchImpl?: FetchLike
): Promise<unknown> {
  const execute =
    fetchImpl ??
    (typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : undefined);
  if (!execute) {
    throw new Error("Global fetch is unavailable. Agent Gauntlet requires Node.js 18 or newer.");
  }

  let response: Response;
  try {
    response = await execute(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenAI API request failed: ${bounded(message, config.apiKey)}`);
  }

  let responseBody: string;
  try {
    responseBody = await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenAI API response body could not be read: ${bounded(message, config.apiKey)}`);
  }

  if (!response.ok) {
    const detail = bounded(responseBody, config.apiKey);
    throw new Error(
      `OpenAI API request failed with HTTP ${response.status}${detail ? `: ${detail}` : "."}`
    );
  }

  try {
    return JSON.parse(responseBody);
  } catch {
    throw new Error("OpenAI API response was not valid JSON.");
  }
}

export function safeOpenAIErrorMessage(error: unknown, secret: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return bounded(message, secret);
}

function bounded(value: string, secret: string, maxLength = 2048): string {
  const safeValue = redact(value, secret);
  return safeValue.length <= maxLength ? safeValue : `${safeValue.slice(0, maxLength)}…`;
}

function redact(value: string, secret: string): string {
  return secret ? value.split(secret).join("[REDACTED]") : value;
}
