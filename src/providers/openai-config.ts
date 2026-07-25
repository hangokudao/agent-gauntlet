export interface ResolvedOpenAIConfig {
  apiKey: string;
  model: string;
  endpoint: string;
}

export function resolveOpenAIConfig(
  configuredModel: string,
  env: NodeJS.ProcessEnv = process.env
): ResolvedOpenAIConfig {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when provider is openai.");
  }

  return {
    apiKey,
    model: env.OPENAI_MODEL ?? configuredModel,
    endpoint: responsesEndpoint(env.OPENAI_BASE_URL)
  };
}

export function responsesEndpoint(baseUrl = "https://api.openai.com"): string {
  const normalized = (baseUrl || "https://api.openai.com").replace(/\/+$/, "");
  if (normalized.endsWith("/v1/responses")) {
    return normalized;
  }
  if (normalized.endsWith("/v1")) {
    return `${normalized}/responses`;
  }
  return `${normalized}/v1/responses`;
}
