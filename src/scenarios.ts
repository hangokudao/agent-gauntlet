import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)), "..");

export async function loadScenarioInstructions(name: string): Promise<string> {
  const scenarioPath = path.join(packageRoot, "scenarios", `${name}.md`);
  try {
    return await readFile(scenarioPath, "utf8");
  } catch {
    return `# ${name}\n\nUse the default Agent Gauntlet checks for this target.`;
  }
}
