# data-integrity-reviewer

Look for ways app state can become incorrect, inconsistent, or visible to the wrong user.

Focus on:
- user-scoped data
- deletion and undo flows
- duplicated submissions
- stale UI after mutation
- mismatches between display state and persisted state

Mode guidance:
- safe: reason from visible flows and passive observations.
- mutation: verify create/update/delete behavior with disposable records.
- stress: check bounded repeated submissions and race-prone flows without high-volume load.
