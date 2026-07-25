export function extractOpenAIOutputText(data: unknown): string {
  const response = requireRecord(data, "OpenAI response");
  const status = response.status;
  const error = optionalRecord(response.error);

  if (status === "failed" || error) {
    const code = optionalString(error?.code);
    const message = optionalString(error?.message);
    if (code && message) {
      throw new Error(`OpenAI response failed (${compact(code)}): ${compact(message)}`);
    }
    if (message) {
      throw new Error(`OpenAI response failed: ${compact(message)}`);
    }
    throw new Error("OpenAI response failed.");
  }

  if (status === "incomplete") {
    const details = optionalRecord(response.incomplete_details);
    const reason = optionalString(details?.reason) ?? "unknown reason";
    throw new Error(`OpenAI response was incomplete: ${compact(reason)}`);
  }

  if (typeof status !== "string") {
    throw new Error("OpenAI response status must be a string.");
  }

  if (status !== "completed") {
    throw new Error(`OpenAI response was not completed: ${compact(status)}`);
  }

  const output = response.output;
  const outputText = optionalString(response.output_text);
  if (!Array.isArray(output) && !outputText) {
    throw new Error("OpenAI response output must be an array.");
  }

  const outputItems = Array.isArray(output) ? output : [];
  const refusal = findRefusal(outputItems);
  if (refusal) {
    throw new Error(`OpenAI response was refused: ${compact(refusal)}`);
  }

  if (outputText) {
    return outputText;
  }

  const textParts = collectOutputText(outputItems);
  if (!textParts.length) {
    throw new Error("OpenAI response did not include textual output.");
  }
  return textParts.join("\n");
}

function findRefusal(output: unknown[]): string | undefined {
  for (const item of output) {
    const record = requireOutputMessage(item);
    if (!record) {
      continue;
    }
    for (const part of record.content as unknown[]) {
      const contentPart = requireContentPart(part);
      if (contentPart.type === "refusal") {
        return optionalString(contentPart.refusal) ?? "no refusal reason provided";
      }
    }
  }
  return undefined;
}

function collectOutputText(output: unknown[]): string[] {
  const textParts: string[] = [];
  for (const item of output) {
    const record = requireOutputMessage(item);
    if (!record) {
      continue;
    }
    for (const part of record.content as unknown[]) {
      const contentPart = requireContentPart(part);
      if (contentPart.type !== "output_text") {
        continue;
      }
      const text = optionalString(contentPart.text);
      if (text) {
        textParts.push(text);
      }
    }
  }
  return textParts;
}

function requireOutputMessage(value: unknown): Record<string, unknown> | undefined {
  const record = optionalRecord(value);
  if (!record) {
    throw new Error("OpenAI response output items must be objects.");
  }

  const type = optionalString(record.type);
  if (!type) {
    throw new Error("OpenAI response output item type must be a string.");
  }
  if (type !== "message") {
    return undefined;
  }
  if (record.role !== "assistant") {
    throw new Error("OpenAI response message role must be assistant.");
  }
  if (!Array.isArray(record.content)) {
    throw new Error("OpenAI response message content must be an array.");
  }
  return record;
}

function requireContentPart(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "OpenAI response content part");
  if (!optionalString(record.type)) {
    throw new Error("OpenAI response content part type must be a string.");
  }
  return record;
}

function requireRecord(value: unknown, name: string): Record<string, unknown> {
  const record = optionalRecord(value);
  if (!record) {
    throw new Error(`${name} must be an object.`);
  }
  return record;
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function compact(value: string, maxLength = 2048): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}…`;
}
