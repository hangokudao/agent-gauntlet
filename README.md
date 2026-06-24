# Agent Gauntlet

[English](README.md) | [한국어](README.ko.md)

Agent Gauntlet creates a Codex-ready testing runbook for web apps you own or are authorized to test.

It does not try to be a fully automated security scanner. Its main job is to create a structured packet of rules, agent roles, evidence folders, and a report template so Codex can inspect a target in a repeatable way.

Inspired by Andrej Karpathy's discussion of agentic engineering: instead of judging a project only by whether it builds, ask capable agents to try to break the app and report what they find.

Reference: [Andrej Karpathy: From Vibe Coding to Agentic Engineering](https://www.youtube.com/watch?v=96jN2OCOfLs&t=1128s), around 18:48.

## Quick Start

```bash
npm install
npm run build
npm link
agent-gauntlet init
agent-gauntlet prepare localhost:3000 --profile content-site --browser
```

For an external target, you must explicitly confirm that you own it or have permission to test it.

```bash
agent-gauntlet prepare <your-authorized-url> --i-own-this-target --mode safe --profile content-site --browser
```

Then ask Codex to execute the generated runbook:

```text
Use runs/<run-id>/gauntlet.md and perform the gauntlet.
```

## What It Creates

```text
runs/<run-id>/
  gauntlet.md
  target.json
  rules.md
  agents/
    security-reviewer.md
    browser-chaos-user.md
    content-reviewer.md
    judge.md
  evidence/
    screenshots/
    notes/
    raw/
  report.md
```

## Profiles

- `content-site`: blogs, docs, marketing pages, read-only sites
- `auth-app`: login, signup, accounts, sessions
- `write-app`: posts, comments, uploads, edit/delete flows
- `api`: API-first services

## Modes

- `safe`: read-only checks, browsing, headers, console errors, public content, metadata
- `mutation`: disposable local/staging targets where test data may be created, edited, or deleted
- `stress`: bounded availability or rate-limit planning; not a load-testing tool

Start with `safe` for external sites.

## Safety Rules

- Localhost targets are allowed by default.
- External targets require `--i-own-this-target`, `target.allowExternal=true`, or `target.allowedHosts`.
- `mutation` requires a local target, `--allow-mutation`, or `target.mutationAllowed=true`.
- `stress` requires `--allow-stress` on a local target, or `target.stressAllowed=true`.
- Agent Gauntlet does not run exploit tools, brute force attempts, or unbounded load tests.

## Local Auth Fixture

If you need a small app with login and write flows, use the local fixture:

```bash
node examples/auth-app/server.js
agent-gauntlet prepare localhost:4321 --profile auth-app --mode safe --browser
```

Or let Agent Gauntlet start it for a direct CLI run:

```bash
agent-gauntlet run localhost:4321 --scenario auth-app --mode safe --dev "node examples/auth-app/server.js"
```

The fixture is intentionally small and imperfect. Do not deploy it.

## Commands

```bash
agent-gauntlet init [--force]
agent-gauntlet prepare <target> [--profile content-site|auth-app|write-app|api] [--mode safe|mutation|stress]
agent-gauntlet run <target> [--scenario name] [--mode safe|mutation|stress] [--dev "command"]
agent-gauntlet report <run-id>
```

`prepare` is the recommended workflow. `run` remains available for simple local smoke checks and generated reports.

## Development

```bash
npm install
npm run build
npm test
```

Requires Node.js 18 or newer.
