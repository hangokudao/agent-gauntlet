import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { AgentDefinition } from "./types.js";

const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)), "..");

export async function loadAgentDefinitions(agentNames: string[]): Promise<AgentDefinition[]> {
  return Promise.all(
    agentNames.map(async (name) => {
      const promptPath = path.join(packageRoot, "agents", `${name}.md`);
      const prompt = await readFile(promptPath, "utf8");
      return { name, prompt };
    })
  );
}
