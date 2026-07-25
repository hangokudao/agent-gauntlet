import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG } from "../src/config.js";
import { resolveOpenAIConfig, responsesEndpoint } from "../src/providers/openai-config.js";

test("resolves OpenAI model precedence and defaults", () => {
  assert.equal(DEFAULT_CONFIG.model, "gpt-5.6");
  assert.equal(
    resolveOpenAIConfig("configured-model", {
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "env-model"
    }).model,
    "env-model"
  );
  assert.equal(
    resolveOpenAIConfig("configured-model", {
      OPENAI_API_KEY: "test-key"
    }).model,
    "configured-model"
  );
});

test("requires an OpenAI API key", () => {
  assert.throws(() => resolveOpenAIConfig("gpt-5.6", {}), /OPENAI_API_KEY is required/);
});

test("normalizes Responses API endpoints", () => {
  assert.equal(responsesEndpoint(), "https://api.openai.com/v1/responses");
  assert.equal(responsesEndpoint("https://gateway.test"), "https://gateway.test/v1/responses");
  assert.equal(responsesEndpoint("https://gateway.test///"), "https://gateway.test/v1/responses");
  assert.equal(responsesEndpoint("https://gateway.test/openai/v1"), "https://gateway.test/openai/v1/responses");
  assert.equal(
    responsesEndpoint("https://gateway.test/openai/v1/responses"),
    "https://gateway.test/openai/v1/responses"
  );
});
