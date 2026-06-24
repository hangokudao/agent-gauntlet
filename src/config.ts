import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GauntletConfig } from "./types.js";

export const CONFIG_FILE = "gauntlet.config.json";

export const DEFAULT_AGENTS = [
  "security-reviewer",
  "browser-chaos-user",
  "data-integrity-reviewer",
  "test-writer"
];

export const DEFAULT_CONFIG: Required<GauntletConfig> = {
  agents: DEFAULT_AGENTS,
  scenario: "default",
  provider: "stub",
  outputDir: "runs",
  target: {
    allowExternal: false
  }
};

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(configPath?: string): Promise<Required<GauntletConfig>> {
  const resolvedPath = path.resolve(configPath ?? CONFIG_FILE);
  if (!(await fileExists(resolvedPath))) {
    return { ...DEFAULT_CONFIG, target: { ...DEFAULT_CONFIG.target } };
  }

  const raw = await readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(raw) as GauntletConfig;

  return {
    agents: parsed.agents ?? DEFAULT_CONFIG.agents,
    scenario: parsed.scenario ?? DEFAULT_CONFIG.scenario,
    provider: parsed.provider ?? DEFAULT_CONFIG.provider,
    outputDir: parsed.outputDir ?? DEFAULT_CONFIG.outputDir,
    target: {
      allowExternal: parsed.target?.allowExternal ?? DEFAULT_CONFIG.target.allowExternal
    }
  };
}

export async function writeDefaultConfig(cwd: string, force = false): Promise<string> {
  const configPath = path.join(cwd, CONFIG_FILE);
  if (!force && (await fileExists(configPath))) {
    throw new Error(`${CONFIG_FILE} already exists. Use --force to overwrite it.`);
  }

  const contents = JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n";
  await writeFile(configPath, contents, "utf8");
  return configPath;
}
