# AGENTS.md

See `CLAUDE.md` for the full architecture overview and command reference. This is a React Router v7 app deployed on Cloudflare Workers (D1 SQLite, R2, better-auth) for taloranderson.com.

## Cursor Cloud specific instructions

### Package manager / tooling

- This repo uses **bun** (not npm), per `bun.lock` and `CLAUDE.md`. Bun is installed at `~/.bun/bin` and on `PATH` via `~/.bashrc`. If a non-interactive shell can't find `bun`, invoke it as `~/.bun/bin/bun`.
- Dependencies are installed by the startup update script (`bun install`). The `postinstall` step runs `wrangler types`, which regenerates `worker-configuration.d.ts` (this file and `bun.lock` may show as modified after install — these are generated, don't commit incidental changes).

### Local database (required before app DB features work)

- The local D1 database lives in `.wrangler/state` (gitignored). Run `bun run db:migrate` to apply migrations to the local D1 before using DB-backed features (blog, auth). This is intentionally NOT in the update script.

### Running the app

- Dev server: `bun run dev` → http://localhost:5173 (HMR). This is the dev workflow; do not use `bun run deploy`/production for local work.
- This is a **single-user** blog: `/signup` only works to create the _first_ user. Once a user exists, registration is disabled and you must use `/login`. Creating/editing posts (`/blog/new`, `/blog/:id/edit`) requires being logged in.

### Tests / checks

- Unit tests (vitest): `bunx vitest run` (matches `app/**/*.test.ts`).
- E2E tests (Playwright): `bun run test`. Requires the chromium browser (`bunx playwright install --with-deps chromium`); Playwright auto-starts the dev server via its `webServer` config and reuses an already-running one on :5173.
- Typecheck: `bun run typecheck`. Note: there are two **pre-existing** type errors in `app/routes/images.tsx` unrelated to environment setup.
- There is no lint script; `bun run format` runs Prettier.
