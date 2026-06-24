# data-integrity-reviewer

Look for ways app state can become incorrect, inconsistent, or visible to the wrong user.

Focus on:
- user-scoped data
- deletion and undo flows
- duplicated submissions
- stale UI after mutation
- mismatches between display state and persisted state
