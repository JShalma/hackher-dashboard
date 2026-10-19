# Hack(H)er413 website

Next.js site for [Hack(H)er413](https://hackher413.com): marketing pages plus the Applications MVP (auth, DB, apply/organizer flows).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill secrets from the vault
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js |
| `npm run build` / `start` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle: schema → SQL migration |
| `npm run db:migrate` | Apply migrations to Neon |
| `npm run db:studio` | Drizzle Studio |
| `npm run email:test -- you@email.com` | Resend smoke test via `sendEmail()` |
| `npm run email:test -- --preview confirmation` | Dump shared-chrome HTML (no Resend) |
| `npm run email:test -- --preview accepted --out /tmp/accepted.html` | Acceptance email + embedded Hive Admit |
| `npm run email:hive-admit` | Write Hive Admit ticket PNG to `/tmp/hive-admit.png` |
| `npm run email:test -- --template accepted you@email.com` | Send a decision/confirm template |

## Environment & Preview deploys

See **[docs/env.md](docs/env.md)** for local `.env.local`, Vercel Development / Preview / Production wiring (Neon, Clerk, Resend), and the Preview verification checklist.

Teammates: build against **Preview** with Clerk **Development** keys. If sign-in fails on a `*.vercel.app` URL, add the host under Clerk allowed origins first.

## Platform helpers

Shared server-only utilities for Applicant and Organizer slices. Prefer these over calling Clerk / Neon / Resend directly from feature code.

### Auth (`src/lib/auth.ts`)

Clerk session wiring lives in `src/proxy.ts`. Roles are **not** env vars — set `publicMetadata.role` on each user in Clerk to `attendee` | `organizer` | `admin`.

| Helper | Use when | Behavior |
| --- | --- | --- |
| `requireUser()` | Any signed-in page / server action | Redirects anonymous users to sign-in; returns `{ userId }` |
| `requireOrganizer()` | Organizer list, detail, status actions | Same as above, then `forbidden()` (403) if role is not organizer/admin |
| `getCurrentRole()` | Soft UI checks | Returns role or `undefined`; never throws |
| `isOrganizerRole(role)` | Client-safe role checks | `true` for `organizer` \| `admin` |
| `roleFromPublicMetadata(meta)` | Parsing Clerk metadata | Pure helper in `auth-role.ts`; used by `requireOrganizer` |

Call the require helpers at the top of Server Components, Server Actions, and Route Handlers. Do not import `@/lib/auth` from Client Components.

Role-gate regression tests: `npm test` (Vitest) covers `auth-role` + submit rate-limit.

### Rate limit (`src/lib/rate-limit.ts`)

In-memory sliding window used by `submitApplication` (`5` attempts / `10` minutes / user). Softens abuse on a single instance; upgrade to Redis if you need cross-instance limits.

### Database (`src/db`)

```ts
import { db } from "@/db";
import { applications } from "@/db/schema";
```

- Server-only. Missing `DATABASE_URL` throws at import time.
- Schema: one `applications` row per Clerk user (`clerkUserId` unique). Core columns + `customFields` JSON for the rest of the form. Status enum: `draft` | `submitted` | `accepted` | `denied` | `waitlisted`.
- Form ↔ DB maps: `src/lib/applications/map-form-to-db.ts`, `map-db-to-form.ts`.
- Migrations: `npm run db:generate` → `npm run db:migrate` (prefer unpooled URL for migrate). Details in [docs/env.md](docs/env.md).

### Email (`src/lib/email.ts` + `src/lib/emails/`)

- `sendEmail({ to, subject, html })` — Resend wrapper (`RESEND_FROM_EMAIL`, optional `RESEND_REPLY_TO`).
- Templates: confirmation, accepted, denied (shared chrome in `src/lib/emails/chrome.ts`). Acceptance embeds Hive Admit via `/api/emails/hive-admit`.
- Preview without sending (works before public Resend): `npm run email:test -- --preview confirmation`.

### Server-action conventions

1. Gate with `requireUser()` or `requireOrganizer()`.
2. Use `db` + schema / map helpers — don’t open a second Neon client.
3. Keep actions next to the feature (`src/app/(site)/apply/actions.ts`, `organizer/apps/actions.ts`).
4. Never import `db`, `auth`, or email senders from Client Components.
