# Agent Gauntlet

Agent Gauntlet는 내가 소유하거나 테스트 권한이 있는 웹앱을 대상으로 여러 에이전트 관점의 점검을 실행하고, 결과를 Markdown/JSON 리포트로 합치는 작은 CLI 도구입니다.

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

## v2 모드

기본값은 `safe`입니다.

```bash
agent-gauntlet run localhost:3000 --mode safe
agent-gauntlet run localhost:3000 --mode mutation
agent-gauntlet run localhost:3000 --mode stress --allow-stress
```

- `safe`: 읽기 중심, 비파괴 탐색, 가짜 입력만 사용합니다.
- `mutation`: disposable local/staging 대상에서 테스트 계정, 게시글, 레코드 생성/수정/삭제를 허용하는 모드입니다.
- `stress`: rate limit이나 중복 제출을 작은 요청 수 안에서 확인하는 모드입니다. 부하 테스트 도구가 아닙니다.

외부 대상에서 `mutation`이나 `stress`를 쓰려면 설정 파일에서 명시적으로 허용해야 합니다.

## Provider

기본 provider는 `stub`입니다. 실제 LLM 기반 점검은 OpenAI provider를 사용합니다.

```bash
OPENAI_API_KEY=... agent-gauntlet run localhost:3000 --provider openai
```

선택적으로 모델을 지정할 수 있습니다.

```bash
agent-gauntlet run localhost:3000 --provider openai --model gpt-5.4-mini
```

OpenAI provider는 구조화 JSON 출력을 기대하고, 결과가 스키마에 맞지 않으면 해당 agent를 실패로 기록합니다.

## Browser Runner

브라우저 관찰을 켜려면 Playwright가 필요합니다.

```bash
npm install -D playwright
npx playwright install chromium
agent-gauntlet run localhost:3000 --browser
```

브라우저 관찰은 같은 origin의 링크를 제한된 개수만 방문하고, 스크린샷과 콘솔 에러를 run 폴더에 저장합니다.

## Dev Server

앱을 켜고 기다렸다가 gauntlet을 실행할 수 있습니다.

```bash
agent-gauntlet run localhost:5173 --dev "npm run dev"
```

실행 후 dev server는 자동으로 종료됩니다.

## 안전 경계

Agent Gauntlet는 권한 있는 대상만 점검하기 위한 도구입니다.

- 로컬호스트 대상은 기본 허용합니다.
- 외부 사이트는 `--i-own-this-target`, `target.allowExternal=true`, 또는 `target.allowedHosts`가 필요합니다.
- `mutation`은 로컬 대상이거나 `--allow-mutation` 또는 `target.mutationAllowed=true`가 필요합니다.
- `stress`는 로컬 대상에서 `--allow-stress`를 주거나 `target.stressAllowed=true`가 필요합니다.
- v2도 실제 침투 도구, 무차별 대입, 무제한 부하 테스트, third-party 스캔은 하지 않습니다.

## 명령

```bash
agent-gauntlet init [--force]
agent-gauntlet run <target> [--scenario name] [--mode safe|mutation|stress]
agent-gauntlet run <target> [--provider stub|openai] [--browser] [--dev "npm run dev"]
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
  "mode": "safe",
  "provider": "stub",
  "model": "gpt-5.4-mini",
  "outputDir": "runs",
  "browser": {
    "enabled": false,
    "maxPages": 5
  },
  "dev": {
    "command": "",
    "readyTimeoutMs": 30000
  },
  "target": {
    "allowExternal": false,
    "allowedHosts": ["localhost", "127.0.0.1", "::1"],
    "sameOriginOnly": true,
    "maxRequests": 30,
    "mutationAllowed": false,
    "stressAllowed": false
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
    browser/
      home.png
    report.md
    report.json
```

## 시나리오

`scenarios/`에는 기본 점검 지침이 들어 있습니다.

- `default`
- `blog`
- `auth-app`
- `twitter-clone`

예:

```bash
agent-gauntlet run localhost:3000 --scenario twitter-clone --mode mutation
```

## 개발

```bash
npm install
npm run build
npm test
```
