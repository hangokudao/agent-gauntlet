import test from "node:test";
import assert from "node:assert/strict";
import { extractOpenAIOutputText } from "../src/providers/openai-response.js";

const resultJson = JSON.stringify({ notes: "ok", findings: [] });

test("extracts completed Responses API output text", () => {
  assert.equal(
    extractOpenAIOutputText({
      status: "completed",
      output: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: resultJson }]
        }
      ]
    }),
    resultJson
  );

  assert.equal(extractOpenAIOutputText({ status: "completed", output_text: resultJson }), resultJson);
});

test("reports refusals before unrelated text", () => {
  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "completed",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              { type: "output_text", text: resultJson },
              { type: "refusal", refusal: "I cannot assist with that request." }
            ]
          }
        ]
      }),
    /OpenAI response was refused: I cannot assist/
  );
});

test("reports incomplete and failed Responses API results", () => {
  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output: []
      }),
    /OpenAI response was incomplete: max_output_tokens/
  );

  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "failed",
        error: { code: "server_error", message: "Temporary failure" }
      }),
    /OpenAI response failed \(server_error\): Temporary failure/
  );
});

test("ignores typed non-output content and rejects malformed protocol data", () => {
  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "completed",
        output: [{ type: "reasoning", content: [{ type: "reasoning_text", text: resultJson }] }]
      }),
    /did not include textual output/
  );
  assert.throws(() => extractOpenAIOutputText(null), /must be an object/);
  assert.throws(
    () => extractOpenAIOutputText({ status: "completed", output: "not-an-array" }),
    /output must be an array/
  );
});

test("rejects missing Responses API protocol discriminators", () => {
  assert.throws(
    () =>
      extractOpenAIOutputText({
        output: [
          {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: resultJson }]
          }
        ]
      }),
    /status must be a string/
  );
  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "completed",
        output: [{ role: "assistant", content: [{ type: "output_text", text: resultJson }] }]
      }),
    /output item type must be a string/
  );
  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "completed",
        output: [{ type: "message", content: [{ type: "output_text", text: resultJson }] }]
      }),
    /message role must be assistant/
  );
  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "completed",
        output: [{ type: "message", role: "assistant", content: [{ text: resultJson }] }]
      }),
    /content part type must be a string/
  );
});

test("rejects malformed typed response fields", () => {
  const validOutput = [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: resultJson }]
    }
  ];

  assert.throws(
    () => extractOpenAIOutputText({ status: "completed", error: "failed", output: validOutput }),
    /response error must be an object/
  );
  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "completed",
        output: "corrupt",
        output_text: resultJson
      }),
    /output must be an array/
  );
  assert.throws(
    () =>
      extractOpenAIOutputText({
        status: "completed",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              { type: "output_text", text: 42 },
              { type: "output_text", text: resultJson }
            ]
          }
        ]
      }),
    /output text must be a non-empty string/
  );
});
