import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

test("init and dry-run create a report", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "agent-gauntlet-"));
  const cli = path.join(process.cwd(), "dist", "src", "cli.js");

  const init = spawnSync(process.execPath, [cli, "init"], { cwd, encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr);

  const run = spawnSync(process.execPath, [cli, "run", "localhost:3000", "--dry-run"], {
    cwd,
    encoding: "utf8"
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Mode: safe/);

  const runId = /Run ID: (.+)/.exec(run.stdout)?.[1]?.trim();
  assert.ok(runId);

  const report = spawnSync(process.execPath, [cli, "report", runId], { cwd, encoding: "utf8" });
  assert.equal(report.status, 0, report.stderr);
  assert.match(report.stdout, /Agent Gauntlet Report/);

  const reportFile = await readFile(path.join(cwd, "runs", runId, "report.md"), "utf8");
  const reportJson = await readFile(path.join(cwd, "runs", runId, "report.json"), "utf8");
  assert.match(reportFile, /Execution: dry-run/);
  assert.match(reportJson, /"mode": "safe"/);
});

test("dry-run supports local mutation mode", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "agent-gauntlet-"));
  const cli = path.join(process.cwd(), "dist", "src", "cli.js");

  const run = spawnSync(process.execPath, [cli, "run", "localhost:3000", "--mode", "mutation", "--dry-run"], {
    cwd,
    encoding: "utf8"
  });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Mode: mutation/);
});

test("stress mode requires explicit opt-in", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "agent-gauntlet-"));
  const cli = path.join(process.cwd(), "dist", "src", "cli.js");

  const run = spawnSync(process.execPath, [cli, "run", "localhost:3000", "--mode", "stress", "--dry-run"], {
    cwd,
    encoding: "utf8"
  });

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Stress mode/);
});
