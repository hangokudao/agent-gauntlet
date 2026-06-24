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

  const runId = /Run ID: (.+)/.exec(run.stdout)?.[1]?.trim();
  assert.ok(runId);

  const report = spawnSync(process.execPath, [cli, "report", runId], { cwd, encoding: "utf8" });
  assert.equal(report.status, 0, report.stderr);
  assert.match(report.stdout, /Agent Gauntlet Report/);

  const reportFile = await readFile(path.join(cwd, "runs", runId, "report.md"), "utf8");
  assert.match(reportFile, /Mode: dry-run/);
});
