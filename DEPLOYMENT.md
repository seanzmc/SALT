# SALT Vercel Deployment

This app deploys to Vercel as a standard Next.js 14 app. No `vercel.json` is required for the current setup.

## 1. Required production environment variables

Set these in Vercel for the `Production` environment:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `BLOB_READ_WRITE_TOKEN`

Set these only if you plan to run the seed script against a fresh production database:

- `SEED_OWNER_EMAIL`
- `SEED_OWNER_PASSWORD`
- `SEED_COLLABORATOR_EMAIL`
- `SEED_COLLABORATOR_PASSWORD`

Notes:

- `DATABASE_URL` is the Neon Postgres connection string already used locally.
- `NEXTAUTH_URL` must be the final production URL for this app, such as `https://<your-project>.vercel.app` or your custom domain.
- `NEXTAUTH_SECRET` is the secret used by NextAuth and middleware JWT verification. Generate a long random value, for example with `openssl rand -base64 32`.
- `BLOB_READ_WRITE_TOKEN` comes from Vercel Blob and is required for production-safe document uploads. Add Blob storage to the project in Vercel, then copy the read/write token into the project environment variables.

## 2. Create or link the Vercel project

This repo is not currently linked to a Vercel project and the local Vercel CLI token in this environment is invalid, so the one required manual step is to create or link the project from your Vercel account.

Smallest dashboard flow:

1. In Vercel, click `Add New` -> `Project`.
2. Import this repository.
3. Keep the detected framework as `Next.js`.
4. Do not override the install command, build command, or output directory.
5. Add the environment variables listed above.
6. Deploy.

If you prefer CLI after signing in yourself:

```bash
npx vercel login
npx vercel link
```

## 3. Build and runtime behavior

- Install/build settings can stay on Vercel defaults.
- `postinstall` now runs `prisma generate`, so Prisma Client is regenerated during install before the app build.
- `npm run build` remains the correct build command.
- No Edge runtime routes were found that use Prisma.
- `app/api/upload/route.ts` already pins `runtime = "nodejs"`.
- The NextAuth route handler uses the default Node runtime, which is correct for this app.
- `middleware.ts` uses `next-auth/jwt` only and does not use Prisma.

## 4. Production migration workflow

Use Prisma migrations manually. Do not put migrations into the Vercel build command.

Correct command:

```bash
DATABASE_URL="your-neon-production-url" npm run db:migrate:deploy
```

When to run it:

1. Before first production use of a fresh database.
2. After any future deploy that includes a new committed Prisma migration.

If you point Vercel at the exact Neon database that is already migrated locally, this command is still safe. It will just apply nothing if the database is already current.

## 5. Production seed procedure

The seed script in this repo is destructive. It starts by deleting existing records before recreating seed data and users.

Run it only once, and only against a fresh or disposable production database:

```bash
DATABASE_URL="your-neon-production-url" \
SEED_OWNER_EMAIL="owner@example.com" \
SEED_OWNER_PASSWORD="strong-owner-password" \
SEED_COLLABORATOR_EMAIL="collaborator@example.com" \
SEED_COLLABORATOR_PASSWORD="strong-collaborator-password" \
npm run db:seed
```

If you are reusing the already-seeded Neon database from local development, do not run the seed script again unless you intentionally want to wipe and recreate the data.

## 6. First login

After the first successful deploy:

1. Open the production app URL.
2. Sign in with the owner account already present in the database.
3. Go to `/settings/account`.
4. Immediately change the owner email and password in-app.

If you used the seed script on a fresh database, log in with the `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` values you supplied for that seed run.

## 7. Document uploads

Document uploads now use Vercel Blob instead of local disk storage.

Operational notes:

- `app/api/upload/route.ts` still runs in the Node runtime, which is correct.
- The app stores the public Blob URL in `Document.storagePath`, so existing document screens and task-linked attachments continue to work without schema changes.
- Existing older local paths like `/uploads/...` still remain valid locally if those files are present.
- Production uploads will fail with a clear error until `BLOB_READ_WRITE_TOKEN` is set.

Recommended setup in Vercel:

1. Add a Blob store to the project.
2. Copy its read/write token into the `BLOB_READ_WRITE_TOKEN` environment variable for Production and Preview as needed.
3. Redeploy after adding the variable.
