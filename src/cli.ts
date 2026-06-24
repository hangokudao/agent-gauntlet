#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_CONFIG, loadConfig, writeDefaultConfig } from "./config.js";
import { runGauntlet } from "./runner.js";

interface ParsedFlags {
  values: Map<string, string | boolean>;
  positionals: string[];
}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "init") {
    const parsed = parseFlags(rest);
    const configPath = await writeDefaultConfig(process.cwd(), Boolean(parsed.values.get("force")));
    console.log(`Created ${path.relative(process.cwd(), configPath)}`);
    return;
  }

  if (command === "run") {
    const parsed = parseFlags(rest);
    const target = parsed.positionals[0];
    if (!target) {
      throw new Error("Usage: agent-gauntlet run <target>");
    }

    const summary = await runGauntlet({
      target,
      scenario: stringFlag(parsed, "scenario"),
      mode: runModeFlag(parsed),
      provider: providerFlag(parsed),
      model: stringFlag(parsed, "model"),
      ownsTarget: Boolean(parsed.values.get("i-own-this-target")),
      allowMutation: Boolean(parsed.values.get("allow-mutation")),
      allowStress: Boolean(parsed.values.get("allow-stress")),
      browser: Boolean(parsed.values.get("browser")),
      noBrowser: Boolean(parsed.values.get("no-browser")),
      devCommand: stringFlag(parsed, "dev"),
      dryRun: Boolean(parsed.values.get("dry-run")),
      configPath: stringFlag(parsed, "config"),
      outputDir: stringFlag(parsed, "output")
    });

    console.log(`Run ID: ${summary.runId}`);
    console.log(`Target: ${summary.target.url}`);
    console.log(`Mode: ${summary.mode}`);
    console.log(`Findings: ${summary.findingCount}`);
    console.log(`Report: ${path.relative(process.cwd(), summary.reportPath)}`);
    console.log(`JSON: ${path.relative(process.cwd(), summary.jsonReportPath)}`);
    return;
  }

  if (command === "report") {
    const parsed = parseFlags(rest);
    const runId = parsed.positionals[0];
    if (!runId) {
      throw new Error("Usage: agent-gauntlet report <run-id>");
    }

    const config = await loadConfig(stringFlag(parsed, "config")).catch(() => DEFAULT_CONFIG);
    const reportPath = path.resolve(config.outputDir, runId, "report.md");
    console.log(await readFile(reportPath, "utf8"));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseFlags(args: string[]): ParsedFlags {
  const values = new Map<string, string | boolean>();
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const name = arg.slice(2);
    if (["scenario", "config", "output", "mode", "provider", "model", "dev"].includes(name)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`--${name} requires a value.`);
      }
      values.set(name, value);
      index += 1;
      continue;
    }

    values.set(name, true);
  }

  return { values, positionals };
}

function stringFlag(parsed: ParsedFlags, name: string): string | undefined {
  const value = parsed.values.get(name);
  return typeof value === "string" ? value : undefined;
}

function runModeFlag(parsed: ParsedFlags): "safe" | "mutation" | "stress" | undefined {
  const value = stringFlag(parsed, "mode");
  if (!value) {
    return undefined;
  }
  if (value === "safe" || value === "mutation" || value === "stress") {
    return value;
  }
  throw new Error("--mode must be one of safe, mutation, or stress.");
}

function providerFlag(parsed: ParsedFlags): "stub" | "openai" | undefined {
  const value = stringFlag(parsed, "provider");
  if (!value) {
    return undefined;
  }
  if (value === "stub" || value === "openai") {
    return value;
  }
  throw new Error("--provider must be stub or openai.");
}

function printHelp(): void {
  console.log(`agent-gauntlet

Usage:
  agent-gauntlet init [--force]
  agent-gauntlet run <target> [--scenario name] [--mode safe|mutation|stress] [--provider stub|openai]
  agent-gauntlet run <target> [--browser] [--dev "npm run dev"] [--i-own-this-target] [--dry-run]
  agent-gauntlet report <run-id>

Examples:
  agent-gauntlet run localhost:3000
  agent-gauntlet run localhost:3000 --mode mutation
  agent-gauntlet run https://blog.yozm.dev --i-own-this-target
`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
