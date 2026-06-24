import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadAgentDefinitions } from "./agents.js";
import { loadConfig } from "./config.js";
import { StubProvider } from "./providers/stub.js";
import { mergeFindings } from "./report/merge-findings.js";
import { renderMarkdownReport } from "./report/render-markdown.js";
import {
  createRunDirectory,
  runConfigPayload,
  writeAgentResult,
  writeRunConfig
} from "./run-store.js";
import { assertTargetAllowed, normalizeTarget } from "./target.js";
import type { AgentResult, RunOptions, RunSummary } from "./types.js";

export async function runGauntlet(options: RunOptions): Promise<RunSummary> {
  const config = await loadConfig(options.configPath);
  const target = normalizeTarget(options.target);
  assertTargetAllowed(target, {
    ownsTarget: options.ownsTarget,
    allowExternal: config.target.allowExternal
  });

  const scenario = options.scenario ?? config.scenario;
  const outputDir = options.outputDir ?? config.outputDir;
  const agents = config.agents;
  const { runId, runDir } = await createRunDirectory(outputDir);
  const dryRun = Boolean(options.dryRun);

  await writeRunConfig(
    runDir,
    runConfigPayload({
      runId,
      target,
      scenario,
      agents,
      dryRun
    })
  );

  const results: AgentResult[] = [];
  if (dryRun) {
    for (const agentName of agents) {
      const result: AgentResult = {
        agentName,
        status: "skipped",
        notes: `Dry run only. Agent ${agentName} was not launched.`,
        findings: []
      };
      results.push(result);
      await writeAgentResult(runDir, result);
    }
  } else {
    const definitions = await loadAgentDefinitions(agents);
    const provider = new StubProvider();
    for (const agent of definitions) {
      const result = await provider.runAgent({ agent, target, scenario });
      results.push(result);
      await writeAgentResult(runDir, result);
    }
  }

  const findings = mergeFindings(results);
  const report = renderMarkdownReport({ runId, target, scenario, dryRun, findings, results });
  const reportPath = path.join(runDir, "report.md");
  await writeFile(reportPath, report, "utf8");

  return {
    runId,
    runDir,
    reportPath,
    target,
    findingCount: findings.length
  };
}
