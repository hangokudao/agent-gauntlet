import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentResult, TargetInfo } from "./types.js";

export async function createRunDirectory(outputDir: string): Promise<{ runId: string; runDir: string }> {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.resolve(outputDir, runId);
  await mkdir(runDir, { recursive: true });
  return { runId, runDir };
}

export async function writeRunConfig(runDir: string, input: unknown): Promise<void> {
  await writeFile(path.join(runDir, "config.json"), JSON.stringify(input, null, 2) + "\n", "utf8");
}

export async function writeAgentResult(runDir: string, result: AgentResult): Promise<void> {
  const agentDir = path.join(runDir, result.agentName);
  await mkdir(agentDir, { recursive: true });
  await writeFile(path.join(agentDir, "notes.md"), result.notes.trim() + "\n", "utf8");
  await writeFile(path.join(agentDir, "findings.json"), JSON.stringify(result.findings, null, 2) + "\n", "utf8");
}

export function runConfigPayload(input: {
  runId: string;
  target: TargetInfo;
  scenario: string;
  agents: string[];
  dryRun: boolean;
}): unknown {
  return input;
}
