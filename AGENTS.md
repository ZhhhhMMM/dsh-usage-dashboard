# AGENTS.md

## dsh-usage-dashboard

Reading and aggregation only. This plugin:

- Is a pure **client** contribution: it registers a `settings.section` and reads
  the live session-list service.
- Does **not** register any host projection (the harness already ships
  `tokenUsage` + `sessionStats` to the browser).
- Does **not** add tools, skills, a settings namespace, or any file/network I/O.

## Data model

- `src/client/usage.ts`: the aggregated `UsageDashboard` view model and the pure
  `aggregate()` fold over session-list entries.
- Session rows carry `projectionValues.tokenUsage` and `projectionValues.sessionStats`.

## Build

`pnpm install && pnpm run check` (esbuild host/client/invariant + tsc declarations).
Client bundle served from `/plugins/dsh-usage-dashboard/client.js`.

## Constraints

- Text stays locale-driven (`NS = 'usage-dashboard'`, zh/en).
- All DOM/CSS scoped under `.dsh_usage_*`.
- Never mutate official DSH DOM — the pet plugin's balance chip was removed for
  exactly that reason; keep this surface read-only.
