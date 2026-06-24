# Agent Gauntlet

[English](README.md) | [한국어](README.ko.md)

Agent Gauntlet는 내가 소유했거나 테스트 권한을 받은 웹앱에 대해, Codex가 바로 실행할 수 있는 점검 runbook을 만들어 줍니다.

완전 자동 보안 스캐너를 목표로 하지는 않습니다. 대신 규칙, 에이전트별 역할, 증거를 모을 폴더, 리포트 템플릿을 한 번에 준비합니다. Codex가 같은 절차로 대상을 살펴볼 수 있게 하려는 도구입니다.

아이디어의 출발점은 Andrej Karpathy가 말한 agentic engineering입니다. 프로젝트가 빌드되는지에서 멈추지 않고, 여러 유능한 에이전트가 앱을 일부러 깨뜨려 보게 한 뒤 그 결과를 리포트하게 하자는 방식입니다.

참고: [Andrej Karpathy: From Vibe Coding to Agentic Engineering](https://www.youtube.com/watch?v=96jN2OCOfLs&t=1128s), 18:48 부근.

## 빠른 시작

```bash
npm install
npm run build
npm link
agent-gauntlet init
agent-gauntlet prepare localhost:3000 --profile content-site --browser
```

외부 사이트는 소유했거나 테스트 허가를 받은 경우에만 명시적으로 실행합니다.

```bash
agent-gauntlet prepare <your-authorized-url> --i-own-this-target --mode safe --profile content-site --browser
```

그다음 Codex에게 생성된 runbook을 기준으로 점검해 달라고 요청합니다.

```text
runs/<run-id>/gauntlet.md 기준으로 점검 진행해줘
```

## 생성물

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

## 공개 도구와 비공개 점검 데이터

생성된 대상별 데이터는 공개 repo에 넣지 않습니다. `runs/`, `reports/`, `evidence/`, `private/`, `gauntlet.config.local.json`은 기본적으로 무시합니다.

Agent Gauntlet가 어떻게 좋아졌는지는 [docs/improvement-log.md](docs/improvement-log.md)에 일반화해서 기록합니다. 실제 대상 도메인, 스크린샷, raw response, 사이트별 finding은 별도 비공개 작업공간에 둡니다. 경계 기준은 [docs/decisions/0001-keep-target-runs-private.md](docs/decisions/0001-keep-target-runs-private.md)에 적어 둡니다.

## 프로필

- `content-site`: 블로그, 문서, 소개 페이지, 읽기 전용 사이트
- `auth-app`: 로그인, 회원가입, 계정, 세션이 있는 앱
- `write-app`: 글쓰기, 댓글, 업로드, 수정/삭제가 있는 앱
- `api`: API 중심 서비스

## 모드

- `safe`: 읽기 전용 점검, 브라우징, 헤더, 콘솔 에러, 공개 콘텐츠, 메타데이터 확인
- `mutation`: 로컬이나 staging처럼 지워도 되는 테스트 대상에서 데이터 생성/수정/삭제를 허용
- `stress`: 작은 범위의 rate limit/가용성 확인을 계획하는 용도이며 부하 테스트 도구가 아님

외부 사이트는 먼저 `safe`로 시작하는 편이 안전합니다.

## 안전 규칙

- 로컬호스트 대상은 기본 허용합니다.
- 외부 대상은 `--i-own-this-target`, `target.allowExternal=true`, 또는 `target.allowedHosts`가 필요합니다.
- `mutation`은 로컬 대상이거나 `--allow-mutation` 또는 `target.mutationAllowed=true`가 필요합니다.
- `stress`는 로컬 대상에서 `--allow-stress`를 주거나 `target.stressAllowed=true`가 필요합니다.
- Agent Gauntlet는 실제 침투 도구, 무차별 대입, 무제한 부하 테스트를 실행하지 않습니다.

## 로컬 로그인 예제

로그인과 글쓰기 흐름이 있는 작은 테스트 앱이 필요하면 로컬 예제 앱을 사용할 수 있습니다.

```bash
node examples/auth-app/server.js
agent-gauntlet prepare localhost:4321 --profile auth-app --mode safe --browser
```

CLI 실행 흐름까지 보려면 Agent Gauntlet가 서버를 켜고 끄게 할 수 있습니다.

```bash
agent-gauntlet run localhost:4321 --scenario auth-app --mode safe --dev "node examples/auth-app/server.js"
```

이 예제 앱은 의도적으로 작고 불완전합니다. 배포하지 마세요.

## 명령

```bash
agent-gauntlet init [--force]
agent-gauntlet prepare <target> [--profile content-site|auth-app|write-app|api] [--mode safe|mutation|stress]
agent-gauntlet run <target> [--scenario name] [--mode safe|mutation|stress] [--dev "command"]
agent-gauntlet report <run-id>
```

기본 흐름은 `prepare`입니다. `run`은 간단한 로컬 스모크 테스트와 리포트 생성용으로 남겨둡니다.

## 개발

```bash
npm install
npm run build
npm test
```

Node.js 18 이상이 필요합니다.
