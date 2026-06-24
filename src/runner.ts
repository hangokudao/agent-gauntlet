import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadAgentDefinitions } from "./agents.js";
import { runBrowserObservation } from "./browser-runner.js";
import { loadConfig } from "./config.js";
import { startDevServer, type DevServerHandle } from "./dev-server.js";
import type { AgentProvider } from "./providers/provider.js";
import { OpenAIProvider } from "./providers/openai.js";
import { StubProvider } from "./providers/stub.js";
import { mergeFindings } from "./report/merge-findings.js";
import { renderMarkdownReport } from "./report/render-markdown.js";
import {
  createRunDirectory,
  runConfigPayload,
  writeAgentResult,
  writeRunConfig
} from "./run-store.js";
import { assertModeAllowed, assertTargetAllowed, normalizeTarget } from "./target.js";
import { loadScenarioInstructions } from "./scenarios.js";
import type { AgentResult, RunOptions, RunSummary } from "./types.js";

export async function runGauntlet(options: RunOptions): Promise<RunSummary> {
  const config = await loadConfig(options.configPath);
  const target = normalizeTarget(options.target);
  assertTargetAllowed(target, {
    ownsTarget: options.ownsTarget,
    allowExternal: config.target.allowExternal,
    allowedHosts: config.target.allowedHosts
  });

  const mode = options.mode ?? config.mode;
  assertModeAllowed(target, mode, {
    allowMutation: options.allowMutation,
    allowStress: options.allowStress,
    mutationAllowed: config.target.mutationAllowed,
    stressAllowed: config.target.stressAllowed
  });

  const scenario = options.scenario ?? config.scenario;
  const scenarioInstructions = await loadScenarioInstructions(scenario);
  const providerName = options.provider ?? config.provider;
  const model = options.model ?? config.model;
  const outputDir = options.outputDir ?? config.outputDir;
  const agents = config.agents;
  const { runId, runDir } = await createRunDirectory(outputDir);
  const dryRun = Boolean(options.dryRun);
  const browserEnabled = options.browser ? true : options.noBrowser ? false : Boolean(config.browser.enabled);
  const devCommand = options.devCommand ?? config.dev.command;
  let devServer: DevServerHandle | undefined;

  try {
    if (devCommand) {
      devServer = await startDevServer(devCommand, target.url, config.dev.readyTimeoutMs ?? 30000);
    }

    const browserObservation = await runBrowserObservation({
      enabled: browserEnabled && !dryRun,
      maxPages: config.browser.maxPages ?? 5,
      sameOriginOnly: config.target.sameOriginOnly ?? true,
      mode,
      runDir,
      target
    });

    await writeRunConfig(
      runDir,
      runConfigPayload({
        runId,
        target,
        scenario,
        mode,
        agents,
        provider: providerName,
        browserObservation,
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
      const provider = createProvider(providerName, model);
      for (const agent of definitions) {
        const result = await runAgentSafely(provider, {
          agent,
          target,
          scenario,
          scenarioInstructions,
          mode,
          browserObservation
        });
        results.push(result);
        await writeAgentResult(runDir, result);
      }
    }

    const findings = mergeFindings(results);
    const report = renderMarkdownReport({
      runId,
      target,
      scenario,
      mode,
      dryRun,
      findings,
      results,
      browserObservation
    });
    const reportPath = path.join(runDir, "report.md");
    const jsonReportPath = path.join(runDir, "report.json");
    await writeFile(reportPath, report, "utf8");
    await writeFile(
      jsonReportPath,
      JSON.stringify({ runId, target, scenario, mode, dryRun, findings, results, browserObservation }, null, 2) + "\n",
      "utf8"
    );

    return {
      runId,
      runDir,
      reportPath,
      jsonReportPath,
      target,
      mode,
      findingCount: findings.length
    };
  } finally {
    await devServer?.stop();
  }
}

function createProvider(providerName: string, model: string): AgentProvider {
  if (providerName === "openai") {
    return new OpenAIProvider({ model });
  }
  return new StubProvider();
}

async function runAgentSafely(
  provider: AgentProvider,
  input: Parameters<AgentProvider["runAgent"]>[0]
): Promise<AgentResult> {
  try {
    return await provider.runAgent(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      agentName: input.agent.name,
      status: "failed",
      notes: `Agent failed: ${message}`,
      findings: []
    };
  }
}
