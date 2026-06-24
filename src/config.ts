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
  mode: "safe",
  provider: "stub",
  model: "gpt-5.4-mini",
  outputDir: "runs",
  browser: {
    enabled: false,
    maxPages: 5
  },
  dev: {
    command: "",
    readyTimeoutMs: 30000
  },
  target: {
    allowExternal: false,
    allowedHosts: ["localhost", "127.0.0.1", "::1"],
    sameOriginOnly: true,
    maxRequests: 30,
    mutationAllowed: false,
    stressAllowed: false
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
    mode: parsed.mode ?? DEFAULT_CONFIG.mode,
    provider: parsed.provider ?? DEFAULT_CONFIG.provider,
    model: parsed.model ?? DEFAULT_CONFIG.model,
    outputDir: parsed.outputDir ?? DEFAULT_CONFIG.outputDir,
    browser: {
      enabled: parsed.browser?.enabled ?? DEFAULT_CONFIG.browser.enabled,
      maxPages: parsed.browser?.maxPages ?? DEFAULT_CONFIG.browser.maxPages
    },
    dev: {
      command: parsed.dev?.command ?? DEFAULT_CONFIG.dev.command,
      readyTimeoutMs: parsed.dev?.readyTimeoutMs ?? DEFAULT_CONFIG.dev.readyTimeoutMs
    },
    target: {
      allowExternal: parsed.target?.allowExternal ?? DEFAULT_CONFIG.target.allowExternal,
      allowedHosts: parsed.target?.allowedHosts ?? DEFAULT_CONFIG.target.allowedHosts,
      sameOriginOnly: parsed.target?.sameOriginOnly ?? DEFAULT_CONFIG.target.sameOriginOnly,
      maxRequests: parsed.target?.maxRequests ?? DEFAULT_CONFIG.target.maxRequests,
      mutationAllowed: parsed.target?.mutationAllowed ?? DEFAULT_CONFIG.target.mutationAllowed,
      stressAllowed: parsed.target?.stressAllowed ?? DEFAULT_CONFIG.target.stressAllowed
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
