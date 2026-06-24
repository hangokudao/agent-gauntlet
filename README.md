# Agent Gauntlet

Agent Gauntlet creates a Codex-ready testing runbook for web apps you own or are authorized to test.

It does not try to be a fully automated security scanner. Its main job is to create a structured packet of rules, agent roles, evidence folders, and a report template so Codex can inspect a target in a repeatable way.

Inspired by Andrej Karpathy's discussion of agentic engineering: instead of judging a project only by whether it builds, ask capable agents to try to break the app and report what they find.

Reference: [Andrej Karpathy: From Vibe Coding to Agentic Engineering](https://www.youtube.com/watch?v=96jN2OCOfLs&t=1128s), around 18:48.

---

## English

### Quick Start

```bash
npm install
npm run build
npm link
agent-gauntlet init
agent-gauntlet prepare localhost:3000 --profile content-site --browser
```

For an external target, you must explicitly confirm that you own it or have permission to test it.

```bash
agent-gauntlet prepare https://skills.yozm.dev --i-own-this-target --mode safe --profile content-site --browser
```

Then ask Codex to execute the generated runbook:

```text
Use runs/<run-id>/gauntlet.md and perform the gauntlet.
```

### What It Creates

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

### Profiles

- `content-site`: blogs, docs, marketing pages, read-only sites
- `auth-app`: login, signup, accounts, sessions
- `write-app`: posts, comments, uploads, edit/delete flows
- `api`: API-first services

### Modes

- `safe`: read-only checks, browsing, headers, console errors, public content, metadata
- `mutation`: disposable local/staging targets where test data may be created, edited, or deleted
- `stress`: bounded availability or rate-limit planning; not a load-testing tool

Start with `safe` for external sites.

### Safety Rules

- Localhost targets are allowed by default.
- External targets require `--i-own-this-target`, `target.allowExternal=true`, or `target.allowedHosts`.
- `mutation` requires a local target, `--allow-mutation`, or `target.mutationAllowed=true`.
- `stress` requires `--allow-stress` on a local target, or `target.stressAllowed=true`.
- Agent Gauntlet does not run exploit tools, brute force attempts, or unbounded load tests.

### Local Auth Fixture

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

### Commands

```bash
agent-gauntlet init [--force]
agent-gauntlet prepare <target> [--profile content-site|auth-app|write-app|api] [--mode safe|mutation|stress]
agent-gauntlet run <target> [--scenario name] [--mode safe|mutation|stress] [--dev "command"]
agent-gauntlet report <run-id>
```

`prepare` is the recommended workflow. `run` remains available for simple local smoke checks and generated reports.

### Development

```bash
npm install
npm run build
npm test
```

Requires Node.js 18 or newer.

---

## 한국어

### 빠른 시작

```bash
npm install
npm run build
npm link
agent-gauntlet init
agent-gauntlet prepare localhost:3000 --profile content-site --browser
```

외부 사이트는 내가 소유했거나 테스트 허가를 받은 대상일 때만 명시적으로 실행합니다.

```bash
agent-gauntlet prepare https://skills.yozm.dev --i-own-this-target --mode safe --profile content-site --browser
```

그 다음 Codex에게 생성된 runbook을 실행하게 합니다.

```text
runs/<run-id>/gauntlet.md 기준으로 점검 진행해줘
```

### 생성되는 것

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

### 프로필

- `content-site`: 블로그, 문서, 소개 페이지, 읽기 전용 사이트
- `auth-app`: 로그인, 회원가입, 계정, 세션이 있는 앱
- `write-app`: 글쓰기, 댓글, 업로드, 수정/삭제가 있는 앱
- `api`: API 중심 서비스

### 모드

- `safe`: 읽기 전용 점검, 브라우징, 헤더, 콘솔 에러, 공개 콘텐츠, 메타데이터 확인
- `mutation`: 로컬이나 staging처럼 disposable한 대상에서 테스트 데이터 생성/수정/삭제를 허용
- `stress`: 작은 범위의 rate limit/가용성 확인 계획용이며 부하 테스트 도구가 아님

외부 사이트는 먼저 `safe`로 시작하는 것을 권장합니다.

### 안전 규칙

- 로컬호스트 대상은 기본 허용합니다.
- 외부 대상은 `--i-own-this-target`, `target.allowExternal=true`, 또는 `target.allowedHosts`가 필요합니다.
- `mutation`은 로컬 대상이거나 `--allow-mutation` 또는 `target.mutationAllowed=true`가 필요합니다.
- `stress`는 로컬 대상에서 `--allow-stress`를 주거나 `target.stressAllowed=true`가 필요합니다.
- Agent Gauntlet는 실제 침투 도구, 무차별 대입, 무제한 부하 테스트를 실행하지 않습니다.

### 로컬 로그인 예제

로그인과 글쓰기 흐름이 있는 작은 테스트 앱이 필요하면 로컬 fixture를 사용할 수 있습니다.

```bash
node examples/auth-app/server.js
agent-gauntlet prepare localhost:4321 --profile auth-app --mode safe --browser
```

직접 CLI 실행을 테스트하려면 Agent Gauntlet가 서버를 켜고 끄게 할 수도 있습니다.

```bash
agent-gauntlet run localhost:4321 --scenario auth-app --mode safe --dev "node examples/auth-app/server.js"
```

이 fixture는 의도적으로 작고 불완전합니다. 배포하지 마세요.

### 명령

```bash
agent-gauntlet init [--force]
agent-gauntlet prepare <target> [--profile content-site|auth-app|write-app|api] [--mode safe|mutation|stress]
agent-gauntlet run <target> [--scenario name] [--mode safe|mutation|stress] [--dev "command"]
agent-gauntlet report <run-id>
```

권장 흐름은 `prepare`입니다. `run`은 간단한 로컬 스모크 테스트와 리포트 생성용으로 남겨둡니다.

### 개발

```bash
npm install
npm run build
npm test
```

Node.js 18 이상이 필요합니다.
