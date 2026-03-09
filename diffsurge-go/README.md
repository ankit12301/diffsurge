# Diffsurge Go Services

Go codebase for Diffsurge CLI, API, proxy, and replay engine.

## Binaries

- `cmd/cli` → Diffsurge CLI (`surge`)
- `cmd/api` → API server
- `cmd/proxy` → traffic capture proxy
- `cmd/replayer` → replay worker service

## Prerequisites

- Go 1.24+
- Access to Postgres and Redis (or Docker Compose from repo root)

## Build and test

```bash
make test
make build
```

## Run locally

```bash
# CLI
GO111MODULE=on go run ./cmd/cli

# API (requires DIFFSURGE_STORAGE_POSTGRES_URL)
PORT=8080 go run ./cmd/api

# Proxy
go run ./cmd/proxy

# Replayer
go run ./cmd/replayer
```

## Environment variables (core)

- `DIFFSURGE_STORAGE_POSTGRES_URL`
- `DIFFSURGE_STORAGE_REDIS_URL`
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

## Related docs

- Root guide: `../README.md`
- Additional architecture and planning docs are maintained internally.
