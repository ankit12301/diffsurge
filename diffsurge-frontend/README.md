# Diffsurge Frontend

Next.js dashboard and marketing application for Diffsurge.

## Scope

- Public landing pages and docs
- Auth flows (login, signup, password reset, verification)
- Protected product areas: traffic, replay, schemas, audit, settings
- Supabase-backed auth/session integration

## Tech stack

- Next.js 16 (App Router)
- TypeScript 5
- TailwindCSS 4
- Radix UI primitives + custom UI kit
- TanStack Query for server-state patterns

## Local development

```bash
cp .env.example .env.local
npm ci
npm run dev
```

App runs at `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run build
```

## Related docs

- Root project guide: `../README.md`
- Additional architecture and standards docs are maintained internally.
