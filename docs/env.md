# Environment variables (local + Vercel)

Secrets live in the **shared vault** and in **Vercel**. Never commit `.env` / `.env.local`.

Canonical list of variable names: [`.env.example`](../.env.example).

## Local setup

```bash
cp .env.example .env.local
# Fill real values from the vault / Clerk / Neon / Resend dashboards
npm run dev
```

Next loads `.env.local` (and `.env`). Prefer `.env.local` for machine-specific secrets.

### Database migrations

```bash
npm run db:generate   # after schema changes
npm run db:migrate    # apply to the DB in DATABASE_URL(_UNPOOLED)
npm run db:studio     # browse tables
```

Use Neon’s **pooled** URL for `DATABASE_URL` (app runtime). Prefer the **direct / unpooled** URL as `DATABASE_URL_UNPOOLED` for `db:migrate`.

## Vercel environments

Set the same keys in the Vercel project → **Settings → Environment Variables**. Scope each variable carefully:

| Variable | Development | Preview | Production | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Neon (dev / branch OK) | Neon (shared preview or branch) | Neon prod | Pooled connection string |
| `DATABASE_URL_UNPOOLED` | optional | optional | optional | For migrations / Kit only |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk **Development** `pk_test_…` | Clerk **Development** `pk_test_…` | Clerk **Production** `pk_live_…` | Public; must match secret |
| `CLERK_SECRET_KEY` | Clerk **Development** `sk_test_…` | Clerk **Development** `sk_test_…` | Clerk **Production** `sk_live_…` | Server only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | `/sign-in` | `/sign-in` | |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | `/sign-up` | `/sign-up` | |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` | `/` | `/` | |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/apply` | `/apply` | `/apply` | |
| `RESEND_API_KEY` | yes | yes | yes | Same account OK for MVP |
| `RESEND_FROM_EMAIL` | verified from-address | same | same | Domain must be verified in Resend |
| `BLOB_READ_WRITE_TOKEN` | yes (for local uploads) | yes | yes | From Vercel Blob store; required for client resume uploads |

### Clerk notes

- Use **Development** keys for local + Vercel Preview so teammates can sign in without prod users.
- Use **Production** keys only on the Production Vercel environment.
- In Clerk Dashboard → Domains / Allowed origins, allow:
  - `http://localhost:3000`
  - `https://*.vercel.app` (or your preview pattern)
  - production hostname
- Roles are **not** env vars. Set `publicMetadata.role` to `attendee` \| `organizer` \| `admin` on each user. Helpers: `requireUser` / `requireOrganizer` in `src/lib/auth.ts`.

### Neon notes

- Preview and Production may share one Neon project with separate branches, or separate projects. Document the choice in the vault.
- After schema changes: migrate the DB that Preview points at before relying on PR demos (`npm run db:migrate` with that URL).

### Resend notes

- From-address must use a **verified** domain (e.g. `hackher413.com`).
- Shared helper: `sendEmail()` in `src/lib/email.ts`.
- Templates + chrome: `src/lib/emails/` (confirmation, accepted, denied). From display name comes from `RESEND_FROM_EMAIL`; Reply-To from `RESEND_REPLY_TO` or the team Gmail.
- Smoke test (does not expose an HTTP endpoint):

```bash
npm run email:test -- you@example.com
# or all three teammates:
npm run email:test -- a@x.com b@y.com c@z.com
# preview chrome without sending (works before domain verify):
npm run email:test -- --preview confirmation --out /tmp/confirm.html
npm run email:test -- --template accepted you@example.com
```

Confirm each inbox receives the message and that Resend Dashboard → Domains shows the sending domain as **Verified**.

### Vercel Blob notes (resume uploads)

1. Vercel project → **Storage** → create a **Blob** store (Private is fine — resumes are sensitive).
2. Connect it to **Development**, **Preview**, and **Production**. If local `vercel env pull` only gets `VERCEL_OIDC_TOKEN` and not `BLOB_READ_WRITE_TOKEN`, Development is missing from the store’s project connection.
3. Pull secrets: `vercel env pull .env.local` — then **re-add** Neon / Clerk / Resend from the vault if pull overwrote them.
4. Uploads go through `/api/resume/upload` (`access: "private"`). View via `/api/resume/file` (auth’d). URL is saved in `applications.resume_url`.

## Preview verification checklist (task 11)

After env vars are saved in Vercel, open a PR Preview URL and confirm:

1. **Build succeeds** (missing `NEXT_PUBLIC_*` / Clerk keys often fail at runtime on first page load).
2. **Clerk**: “Sign in” works on the Preview URL (add the Preview host in Clerk if prompted).
3. **DB**: from a machine with Preview’s `DATABASE_URL`, `npm run db:studio` (or a tiny server query) sees the `applications` table.
4. **Resend**: key present in Preview env (send test can wait for the email helper commit).

If Preview auth fails with redirect/origin errors, fix Clerk allowed origins first, not the Next code.

## Rotating secrets

1. Create new key in the provider dashboard.
2. Update Vercel (all relevant envs) + vault + local `.env.local`.
3. Redeploy Preview/Production.
4. Revoke the old key.
