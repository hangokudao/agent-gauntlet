# Auth App Example

This is a local-only disposable app for testing Agent Gauntlet against an app with login, sessions, profile pages, and a write flow.

It is intentionally small and imperfect. Do not deploy it.

## Run The App

```bash
node examples/auth-app/server.js
```

The app starts at `http://localhost:4321`.

Test accounts:

- `alice@example.test` / `password123`
- `bob@example.test` / `password123`

## Run Agent Gauntlet

From the repo root:

```bash
node dist/src/cli.js run localhost:4321 --scenario auth-app --mode safe
```

You can also let Agent Gauntlet start and stop the server:

```bash
node dist/src/cli.js run localhost:4321 --scenario auth-app --mode safe --dev "node examples/auth-app/server.js"
```

For disposable local mutation testing:

```bash
node dist/src/cli.js run localhost:4321 --scenario auth-app --mode mutation --dev "node examples/auth-app/server.js"
```

Known seeded issue: a signed-in user can request another user's profile by changing the `id` query string. This makes the fixture useful for future auth-aware browser and agent work.
