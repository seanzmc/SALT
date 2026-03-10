# Purpose

Guide Codex to make safe, minimal changes in this repository.

Optimize for:
- preserving current Next.js app-router behavior
- reusing existing auth, Prisma, validation, and server action patterns
- avoiding changes that break server/client boundaries
- verifying with commands that actually work in this repo

# Stack Snapshot

- Next.js 14 app router
- React 18
- TypeScript
- Prisma 6 with PostgreSQL
- NextAuth 4 credentials auth with JWT sessions
- `bcryptjs` password hashing
- server actions in `server/actions.ts`
- validation in `lib/validators.ts`
- auth/session helpers in `lib/auth.ts` and `server/authz.ts`
- Prisma client singleton in `lib/prisma.ts`
- Prisma schema in `prisma/schema.prisma`
- seed script in `prisma/seed.ts`

# Non-Negotiable Repo Rules

- Keep changes small and localized. Prefer targeted edits over refactors.
- Do not introduce new libraries unless the existing stack cannot reasonably support the task.
- Reuse existing modules before creating new ones:
  - auth/session: `lib/auth.ts`, `server/authz.ts`
  - validation: `lib/validators.ts`
  - DB access: `lib/prisma.ts`
  - activity logging: `server/activity.ts`
  - server actions: `server/actions.ts`
- Match existing path aliases and file organization. Do not create parallel abstractions unless there is a clear repo-wide need.
- If the task touches deployment, auth, Prisma, middleware, route handlers, or server actions, explicitly check Next.js app-router/runtime constraints before editing.

# Server Action Rules

- In any file marked `"use server"`, export async functions only.
- Do not export objects, constants, schemas, types used by clients, sync helpers, or runtime values from `"use server"` files.
- Keep validation schemas outside server action files. This repo already uses `lib/validators.ts`.
- Keep reusable auth/authorization helpers outside server action files. This repo already uses `server/authz.ts`.
- Client components may import server actions directly for form `action` or `useFormState`, but must not import non-action runtime values from server action modules.
- If a helper is needed by both server actions and other server code, move it to a non-`"use server"` module.
- After mutations, follow the existing pattern: update data, log activity when relevant, then `revalidatePath` only for affected routes.

# Auth And User-Management Rules

- Inspect `lib/auth.ts`, `server/authz.ts`, `middleware.ts`, `types/next-auth.d.ts`, and any touched routes/pages before changing auth behavior.
- Preserve the current session model unless the task explicitly requires a change:
  - NextAuth credentials provider
  - JWT session strategy
  - role copied onto token/session
- Password checks and updates must continue to use `bcryptjs`.
- Normalize emails to lowercase where the current code already does so.
- Use existing owner/collaborator authorization patterns instead of inventing new ones:
  - `requireSession()` for authenticated access
  - `requireOwner()` for owner-only flows
  - collaborator-safe task editing based on assignment
- Prefer existing owner-only / collaborator-safe rules already present in `server/actions.ts` and task pages.
- Before changing protected routes or redirects, inspect both `middleware.ts` and server-side guards. Do not assume middleware alone is enough.

# Prisma/Database Rules

- Use the shared Prisma client from `lib/prisma.ts`. Do not instantiate new `PrismaClient` instances in feature code.
- Read `prisma/schema.prisma` before changing queries, relations, enums, or assumptions about ownership and roles.
- Reuse existing Prisma query shapes and include/select patterns where possible.
- If schema changes are required, check `prisma/seed.ts` and update seed data when necessary.
- Do not add a second validation layer or ORM wrapper around Prisma for a localized task.
- Be careful with task ownership, assignment, and role semantics. The schema and action logic already encode these constraints.

# UI/Component Rules

- Check whether a component is server or client before importing modules into it.
- Do not import non-action values from `server/actions.ts` into client components.
- Prefer existing UI primitives in `components/ui/*`.
- Keep form handling aligned with current patterns:
  - direct server action `action={...}` for simple mutations
  - `useFormState` for actions returning structured form state
- Avoid moving logic across the server/client boundary unless the task requires it.

# Deployment/Config Rules

- Before changing env vars, auth config, upload paths, or deployment behavior, inspect actual usage in code and `.env.example`.
- Keep env changes consistent with the current variables:
  - `DATABASE_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - seed credential vars
- If touching route handlers that use file uploads or Node APIs, verify runtime requirements. `app/api/upload/route.ts` already pins `runtime = "nodejs"`.
- If touching middleware, remember it runs in the Next.js middleware runtime and cannot rely on Node-only server patterns.

# Verification Checklist

- Preferred verification commands in this repo:
  - `npx tsc --noEmit`
  - `npm run build`
- `next lint` is not a reliable gate here yet. Do not present it as the main verification step unless the task is specifically about lint setup.
- Report exactly what you ran and whether it passed or failed.
- If a task changes Prisma schema or seed behavior, run the smallest relevant DB command only when needed and say what was executed.

# Safe Workflow For Codex

1. Inspect the existing files that already own the behavior.
2. Identify the smallest viable change.
3. Reuse current patterns for validation, auth, Prisma access, and revalidation.
4. Check server/client boundaries before moving imports or helpers.
5. If touching auth, Prisma, middleware, deployment config, or route handlers, explicitly verify app-router/runtime constraints.
6. Run the real repo verification commands that fit the change.
7. Report concrete files changed and concrete commands run.

# Things To Avoid In This Repo

- Do not export sync helpers, constants, schemas, or miscellaneous runtime values from `"use server"` files.
- Do not import non-action runtime values from server action modules into client components.
- Do not rewrite auth/session flow without first inspecting the current NextAuth, middleware, and `server/authz.ts` patterns.
- Do not create duplicate validation modules, duplicate Prisma wrappers, or alternate auth helpers.
- Do not do sweeping renames or broad refactors for a localized task.
- Do not add new dependencies for convenience.
- Do not change env vars or deployment config based on assumptions; inspect code usage and `.env.example` first.
- Do not claim verification was done unless the commands were actually run.
