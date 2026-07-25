import test from "node:test";
import assert from "node:assert/strict";
import { OpenAIProvider } from "../src/providers/openai.js";
import type { AgentProvider } from "../src/providers/provider.js";

const input: Parameters<AgentProvider["runAgent"]>[0] = {
  agent: { name: "security-reviewer", prompt: "Review security." },
  target: {
    input: "localhost:3000",
    url: "http://localhost:3000/",
    hostname: "localhost",
    isLocal: true
  },
  scenario: "default",
  scenarioInstructions: "Check the target.",
  mode: "safe",
  browserObservation: {
    enabled: false,
    status: "skipped",
    notes: "Browser observation was disabled.",
    pagesVisited: [],
    consoleErrors: [],
    screenshots: []
  }
};

test("posts an injected GPT-5.6 Responses request and validates the result", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  const provider = new OpenAIProvider({
    model: "configured-model",
    env: {
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "gpt-5.6",
      OPENAI_BASE_URL: "https://gateway.test/openai/v1"
    },
    fetchImpl: async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(
        JSON.stringify({
          status: "completed",
          output: [
            {
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({ notes: " Checked the app. ", findings: [] })
                }
              ]
            }
          ]
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
  });

  const result = await provider.runAgent(input);

  assert.equal(capturedUrl, "https://gateway.test/openai/v1/responses");
  assert.equal(capturedInit?.method, "POST");
  assert.equal((capturedInit?.headers as Record<string, string>).Authorization, "Bearer test-key");
  assert.equal(JSON.parse(String(capturedInit?.body)).model, "gpt-5.6");
  assert.equal(result.agentName, "security-reviewer");
  assert.equal(result.status, "completed");
  assert.equal(result.notes, "Checked the app.");
});

test("bounds and redacts non-2xx response bodies", async () => {
  const provider = new OpenAIProvider({
    model: "gpt-5.6",
    env: { OPENAI_API_KEY: "secret-test-key" },
    fetchImpl: async () => new Response(`secret-test-key ${"x".repeat(3000)}`, { status: 429 })
  });

  await assert.rejects(
    () => provider.runAgent(input),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /HTTP 429/);
      assert.doesNotMatch(error.message, /secret-test-key/);
      assert.ok(error.message.length < 2200);
      return true;
    }
  );
});

test("parses successful responses before applying secret redaction", async () => {
  const provider = new OpenAIProvider({
    model: "gpt-5.6",
    env: { OPENAI_API_KEY: "completed" },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          status: "completed",
          output_text: JSON.stringify({ notes: "ok", findings: [] })
        })
      )
  });

  assert.equal((await provider.runAgent(input)).notes, "ok");
});

test("redacts secrets from successful response envelope errors", async () => {
  const provider = new OpenAIProvider({
    model: "gpt-5.6",
    env: { OPENAI_API_KEY: "secret-test-key" },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          status: "failed",
          error: { code: "gateway_error", message: "secret-test-key was rejected" }
        })
      )
  });

  await assert.rejects(
    () => provider.runAgent(input),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /gateway_error/);
      assert.doesNotMatch(error.message, /secret-test-key/);
      return true;
    }
  );
});

test("redacts and bounds structured output validation errors", async () => {
  const secret = "secret-test-key";
  const secretFieldProvider = new OpenAIProvider({
    model: "gpt-5.6",
    env: { OPENAI_API_KEY: secret },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          status: "completed",
          output_text: JSON.stringify({ notes: "ok", findings: [], [secret]: true })
        })
      )
  });
  await assert.rejects(
    () => secretFieldProvider.runAgent(input),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.doesNotMatch(error.message, new RegExp(secret));
      return true;
    }
  );

  const oversizedFieldProvider = new OpenAIProvider({
    model: "gpt-5.6",
    env: { OPENAI_API_KEY: secret },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          status: "completed",
          output_text: JSON.stringify({
            notes: "ok",
            findings: [],
            ["x".repeat(3000)]: true
          })
        })
      )
  });
  await assert.rejects(
    () => oversizedFieldProvider.runAgent(input),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.length < 2200);
      return true;
    }
  );
});

test("reports malformed HTTP and structured output JSON clearly", async () => {
  const invalidHttp = new OpenAIProvider({
    model: "gpt-5.6",
    env: { OPENAI_API_KEY: "test-key" },
    fetchImpl: async () => new Response("not-json", { status: 200 })
  });
  await assert.rejects(() => invalidHttp.runAgent(input), /OpenAI API response was not valid JSON/);

  const invalidOutput = new OpenAIProvider({
    model: "gpt-5.6",
    env: { OPENAI_API_KEY: "test-key" },
    fetchImpl: async () =>
      new Response(JSON.stringify({ status: "completed", output_text: "{not-json" }), {
        headers: { "Content-Type": "application/json" }
      })
  });
  await assert.rejects(() => invalidOutput.runAgent(input), /OpenAI response output was not valid JSON/);
});

test("reports network errors without exposing request contents", async () => {
  const provider = new OpenAIProvider({
    model: "gpt-5.6",
    env: { OPENAI_API_KEY: "test-key" },
    fetchImpl: async () => {
      throw new Error("connection refused");
    }
  });

  await assert.rejects(() => provider.runAgent(input), /OpenAI API request failed: connection refused/);
});
