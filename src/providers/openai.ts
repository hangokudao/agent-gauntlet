import type { AgentProvider } from "./provider.js";
import { validateAgentPayload } from "../validation.js";
import { resolveOpenAIConfig } from "./openai-config.js";
import {
  postOpenAIResponse,
  safeOpenAIErrorMessage,
  type FetchLike
} from "./openai-http.js";
import { buildOpenAIRequest } from "./openai-request.js";
import { extractOpenAIOutputText } from "./openai-response.js";

interface OpenAIProviderOptions {
  model: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: FetchLike;
}

export class OpenAIProvider implements AgentProvider {
  constructor(private readonly options: OpenAIProviderOptions) {}

  async runAgent(input: Parameters<AgentProvider["runAgent"]>[0]) {
    const config = resolveOpenAIConfig(this.options.model, this.options.env);
    const request = buildOpenAIRequest(config.model, input);
    const response = await postOpenAIResponse(config, request, this.options.fetchImpl);
    try {
      const outputText = extractOpenAIOutputText(response);
      let payload: unknown;
      try {
        payload = JSON.parse(outputText);
      } catch {
        throw new Error("OpenAI response output was not valid JSON.");
      }
      return validateAgentPayload(payload, input.agent.name);
    } catch (error) {
      throw new Error(safeOpenAIErrorMessage(error, config.apiKey));
    }
  }
}
