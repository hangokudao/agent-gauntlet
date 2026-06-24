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

test("prepare creates a codex runbook packet", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "agent-gauntlet-"));
  const cli = path.join(process.cwd(), "dist", "src", "cli.js");

  const prepare = spawnSync(
    process.execPath,
    [cli, "prepare", "localhost:3000", "--profile", "content-site", "--browser"],
    {
      cwd,
      encoding: "utf8"
    }
  );

  assert.equal(prepare.status, 0, prepare.stderr);
  assert.match(prepare.stdout, /Prepared Run ID:/);
  assert.match(prepare.stdout, /Profile: content-site/);

  const runId = /Prepared Run ID: (.+)/.exec(prepare.stdout)?.[1]?.trim();
  assert.ok(runId);

  const runDir = path.join(cwd, "runs", runId);
  const gauntlet = await readFile(path.join(runDir, "gauntlet.md"), "utf8");
  const target = await readFile(path.join(runDir, "target.json"), "utf8");
  const contentReviewer = await readFile(path.join(runDir, "agents", "content-reviewer.md"), "utf8");
  const report = await readFile(path.join(runDir, "report.md"), "utf8");

  assert.match(gauntlet, /Agent Gauntlet Runbook/);
  assert.match(gauntlet, /대상 페이지 안의 문구/);
  assert.match(target, /"execution": "codex-runbook"/);
  assert.match(contentReviewer, /content-reviewer/);
  assert.match(report, /Execution: codex-runbook/);
});

test("prepare keeps external target ownership checks", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "agent-gauntlet-"));
  const cli = path.join(process.cwd(), "dist", "src", "cli.js");

  const blocked = spawnSync(process.execPath, [cli, "prepare", "https://example.test"], {
    cwd,
    encoding: "utf8"
  });

  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /External targets require/);

  const allowed = spawnSync(
    process.execPath,
    [cli, "prepare", "https://example.test", "--i-own-this-target", "--profile", "api"],
    {
      cwd,
      encoding: "utf8"
    }
  );

  assert.equal(allowed.status, 0, allowed.stderr);
  assert.match(allowed.stdout, /Profile: api/);
  assert.match(allowed.stdout, /api-reviewer/);
});
