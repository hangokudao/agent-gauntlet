# Agent Gauntlet

[English](README.md) | [한국어](README.ko.md)

Agent Gauntlet는 내가 소유했거나 테스트 권한이 있는 웹앱을 대상으로 Codex가 실행할 수 있는 점검 runbook을 만드는 도구입니다.

완전 자동 보안 스캐너를 목표로 하지 않습니다. 규칙, 에이전트 역할, 증거 폴더, 리포트 템플릿을 하나의 실행 패킷으로 만들어서 Codex가 반복 가능한 방식으로 대상을 점검하게 하는 것이 핵심입니다.

출발점은 Andrej Karpathy가 말한 agentic engineering 아이디어입니다. 프로젝트가 단순히 빌드되는지만 보는 대신, 여러 강한 에이전트가 앱을 깨보게 하고 그 결과를 리포트하게 하는 방식입니다.

참고: [Andrej Karpathy: From Vibe Coding to Agentic Engineering](https://www.youtube.com/watch?v=96jN2OCOfLs&t=1128s), 18:48 부근.

## 빠른 시작

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

## 생성되는 것

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

## 프로필

- `content-site`: 블로그, 문서, 소개 페이지, 읽기 전용 사이트
- `auth-app`: 로그인, 회원가입, 계정, 세션이 있는 앱
- `write-app`: 글쓰기, 댓글, 업로드, 수정/삭제가 있는 앱
- `api`: API 중심 서비스

## 모드

- `safe`: 읽기 전용 점검, 브라우징, 헤더, 콘솔 에러, 공개 콘텐츠, 메타데이터 확인
- `mutation`: 로컬이나 staging처럼 disposable한 대상에서 테스트 데이터 생성/수정/삭제를 허용
- `stress`: 작은 범위의 rate limit/가용성 확인 계획용이며 부하 테스트 도구가 아님

외부 사이트는 먼저 `safe`로 시작하는 것을 권장합니다.

## 안전 규칙

- 로컬호스트 대상은 기본 허용합니다.
- 외부 대상은 `--i-own-this-target`, `target.allowExternal=true`, 또는 `target.allowedHosts`가 필요합니다.
- `mutation`은 로컬 대상이거나 `--allow-mutation` 또는 `target.mutationAllowed=true`가 필요합니다.
- `stress`는 로컬 대상에서 `--allow-stress`를 주거나 `target.stressAllowed=true`가 필요합니다.
- Agent Gauntlet는 실제 침투 도구, 무차별 대입, 무제한 부하 테스트를 실행하지 않습니다.

## 로컬 로그인 예제

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

## 명령

```bash
agent-gauntlet init [--force]
agent-gauntlet prepare <target> [--profile content-site|auth-app|write-app|api] [--mode safe|mutation|stress]
agent-gauntlet run <target> [--scenario name] [--mode safe|mutation|stress] [--dev "command"]
agent-gauntlet report <run-id>
```

권장 흐름은 `prepare`입니다. `run`은 간단한 로컬 스모크 테스트와 리포트 생성용으로 남겨둡니다.

## 개발

```bash
npm install
npm run build
npm test
```

Node.js 18 이상이 필요합니다.
