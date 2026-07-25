# Improvement Log

Use this log for public, generalized changes to Agent Gauntlet.

Do not include real target domains, screenshots, raw responses, secrets, account data, or site-specific findings. Keep those in a private workspace outside this repository.

## Template

```md
## YYYY-MM-DD

### Title

Area:
- profile, rules, report template, CLI, docs, tests, or another public tool area

Reason:
- What kind of review exposed the gap, without naming the real target

Change:
- What changed in Agent Gauntlet

Verification:
- Commands, tests, or manual checks used

Privacy:
- Confirm no target domains, evidence files, raw responses, screenshots, or secrets were added
```

## Entries

## 2026-07-26

### Refine the OpenAI provider boundary

Area:
- provider, CLI, docs, tests, and CI

Reason:
- The OpenAI integration needed explicit protocol handling and a testable boundary before changing the active model default.

Change:
- Split OpenAI configuration, request construction, HTTP transport, and response parsing into focused modules.
- Handle refusals, incomplete responses, failed responses, malformed output, and bounded HTTP errors explicitly.
- Default active configs to `gpt-5.6` and document model precedence and custom Responses API endpoints.
- Add Node 18.20 and Node 20 CI coverage with a compatible pnpm release.

Verification:
- `pnpm test`

Privacy:
- No target domains, evidence files, raw responses, screenshots, or secrets were added.
