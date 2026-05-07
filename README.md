# WeClaws

WeClaws is a monorepo for a single-machine, multi-user Weixin bot control plane.

## Overview

- `apps/web`: UI, HTTP API, SSE, and authentication
- `apps/supervisor`: FastAgent child-process lifecycle and runtime reconciliation
- `packages/db`: SQLite schema, migrations, and repositories
- `packages/shared`: Cross-workspace contracts and constants

## Repository Layout

```text
apps/
packages/
infra/
docs/manuals/
resources/skills/
storage/
```

## Documentation

- [docs/manuals/README.md](docs/manuals/README.md)

## Development

```bash
pnpm install
pnpm dev:web
pnpm dev:supervisor
pnpm build
pnpm test
pnpm typecheck
pnpm db:generate
pnpm db:migrate
```

## Environment

Copy `.env.example` for local development and `infra/compose/.env.example` for Docker Compose.

Required for local web development:

- `DATABASE_URL`
- `APP_BASE_URL`
- `BETTER_AUTH_SECRET`

## License

MIT
