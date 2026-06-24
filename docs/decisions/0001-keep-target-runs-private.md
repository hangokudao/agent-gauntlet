# Decision 0001: Keep Target Runs Private

## Status

Accepted

## Context

Agent Gauntlet is intended to improve over time through real reviews of authorized targets. Those reviews can produce domains, screenshots, raw responses, console output, notes, and reports that are useful for the operator but inappropriate for a public repository.

## Decision

Keep the public repository focused on the tool:

- CLI source code
- tests
- generic agent instructions
- generic examples
- public documentation
- generalized improvement notes

Keep target-specific material outside the public repository:

- `runs/`
- screenshots
- raw responses
- console logs
- generated reports
- target-specific configs
- private field notes

When a real review suggests an Agent Gauntlet improvement, generalize it before committing it. For example, write "add canonical URL checks to the content-site profile" instead of naming the site where the gap was found.

## Consequences

Public history stays easier to share and review. Private review data remains available locally or in a separate private repository. Some context behind a public improvement may be intentionally absent, so public entries should include enough generalized reasoning to explain the change.
