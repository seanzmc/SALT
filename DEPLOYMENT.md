# SALT Deployment Surface

## Active applications

- Frontend: `apps/web` (Vite)
- API: `apps/api` (Express)
- Shared packages: `packages/db`, `packages/domain`, `packages/types`, `packages/validation`
- Archived legacy Next app: `archive/legacy-next-app`

The repository root is a workspace shell for shared config, Prisma schema/seed files, and package orchestration. It is not an active Next.js app and should not be deployed as one.

## Current build commands

- Frontend build: `npm run build:web`
- API build: `npm run build:api`
- Workspace build: `npm run build`
- Root typecheck: `npx tsc --noEmit`

## Database commands

- Generate Prisma client: `npm run db:generate`
- Apply local migration: `npm run db:migrate`
- Apply committed migrations: `npm run db:migrate:deploy`
- Seed data: `npm run db:seed`

## Environment variables

Keep root env changes aligned with actual active code usage:

- `DATABASE_URL`
- `SESSION_SECRET`
- `WEB_ORIGIN`
- `SALT_API_ORIGIN`
- seed credential vars
- SMTP vars if email flows are used
- `BLOB_READ_WRITE_TOKEN` if document uploads are used

`NEXTAUTH_URL` and `NEXTAUTH_SECRET` remain in `.env.example` only for legacy archive reference and should not drive current deployment decisions for `apps/web` or `apps/api`.

## Archived app

`archive/legacy-next-app` is preserved for reference only. Do not edit it for active development, and do not point deployment tooling at it unless you are intentionally reviving the archived Next app.
