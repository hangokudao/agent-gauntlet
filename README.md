# Agent Gauntlet

Agent Gauntlet는 내가 소유하거나 테스트 권한이 있는 웹앱을 대상으로 여러 에이전트 관점의 점검을 실행하고, 결과를 하나의 마크다운 리포트로 합치는 작은 CLI 도구입니다.

출발점은 Andrej Karpathy가 Sequoia 대담에서 말한 아이디어입니다. 기존 코딩 퍼즐 대신, 큰 앱을 만들게 하고, 실제 사용을 시뮬레이션한 뒤, 여러 고추론 에이전트가 그 앱을 깨보게 하는 방식이 agentic engineering 평가에 더 어울린다는 이야기였습니다. 관련 구간은 YouTube 영상 `Andrej Karpathy: From Vibe Coding to Agentic Engineering`의 18:48 부근입니다.

https://www.youtube.com/watch?v=96jN2OCOfLs&t=1128s

## 빠른 시작

```bash
npm install
npm run build
npm link
agent-gauntlet init
agent-gauntlet run localhost:3000
agent-gauntlet report <run-id>
```

로컬 앱은 스킴을 생략해도 됩니다.

```bash
agent-gauntlet run localhost:5173
```

외부 URL은 명확한 스킴과 소유/권한 확인이 필요합니다.

```bash
agent-gauntlet run https://blog.yozm.dev --i-own-this-target
```

## 안전 경계

Agent Gauntlet v1은 권한 있는 대상만 점검하기 위한 도구입니다.

- 로컬호스트 대상은 기본 허용합니다.
- 외부 사이트는 `--i-own-this-target` 또는 설정 파일의 `target.allowExternal=true`가 필요합니다.
- v1은 파괴적 공격, 부하 테스트, 무차별 대입, 실제 침투 도구 실행을 하지 않습니다.
- 지금 provider는 보수적인 stub/passive provider입니다. 에이전트별 산출물 구조를 만들고, `security-reviewer`는 기본 보안 헤더 같은 수동적 HTTP 점검만 수행합니다.

## 명령

```bash
agent-gauntlet init [--force]
agent-gauntlet run <target> [--scenario name] [--i-own-this-target] [--dry-run]
agent-gauntlet report <run-id>
```

## 설정

`agent-gauntlet init`은 `gauntlet.config.json`을 만듭니다.

```json
{
  "agents": [
    "security-reviewer",
    "browser-chaos-user",
    "data-integrity-reviewer",
    "test-writer"
  ],
  "scenario": "default",
  "provider": "stub",
  "outputDir": "runs",
  "target": {
    "allowExternal": false
  }
}
```

## 실행 결과

각 실행은 `runs/<날짜-시간>/` 아래에 저장됩니다.

```text
runs/
  2026-06-24T00-00-00-000Z/
    config.json
    security-reviewer/
      notes.md
      findings.json
    browser-chaos-user/
      notes.md
      findings.json
    report.md
```

## v1 범위

이 버전은 완성형 보안 스캐너가 아닙니다. 목적은 다음 세 가지입니다.

1. 대상 URL과 에이전트 점검 관점을 표준화합니다.
2. 실행 결과를 재현 가능한 폴더 구조로 남깁니다.
3. 나중에 Codex/OpenAI/local agent provider를 붙일 수 있는 작은 경계를 마련합니다.

## 개발

```bash
npm install
npm run build
npm test
```
