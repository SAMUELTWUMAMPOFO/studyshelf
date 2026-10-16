# StudyShelf

A simple, modern, mobile-friendly website where students can browse and download
lecture slides and study materials — and the site owner can upload and manage
them from an admin panel embedded directly in the same page.

- Public library: search by title / course / code / keyword, filter by
  programme, level (100–400), semester, course and material type, and download
  any published file. No account needed.
- Embedded admin panel: click the **Admin** button on the homepage. First-time
  setup lets you create your own administrator email + password; after that the
  same modal unlocks the upload / manage dashboard. There is no separate admin
  page.
- Supported file types: **PDF, PPT, PPTX** (adding more later only requires one
  entry in `src/lib/constants.ts` → `ACCEPTED_FILE_TYPES`).
- Max file size: **50 MB**.

---

## Tech stack (and one important note)

This build uses the runtime environment that was available:

| Concern            | Implementation                                                                 |
| ------------------ | ------------------------------------------------------------------------------ |
| Frontend           | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui              |
| Database           | SQLite via Prisma ORM (`db/custom.db`)                                          |
| File storage       | Server-side filesystem (`db/uploads/`), served through an authenticated API     |
| Admin auth         | Email + password (scrypt-hashed), httpOnly session cookie, server-side guards   |

**Why not Supabase?** Supabase is a hosted cloud service that requires *your*
project URL and API keys. Rather than shipping a website that cannot run until
someone creates a Supabase project, this build implements the same architecture
(database + file storage + authentication + row-level authorization) on the
bundled stack, so it works end-to-end out of the box. Every admin operation is
**enforced on the server** (visitors can never upload, edit or delete by
calling the API directly — verified by 401 responses), which is the same
guarantee Supabase RLS would give you.

If you prefer Supabase-managed infrastructure, see the appendix below for the
exact migration steps.

---

## Quick start (local)

```bash
bun install
bun run db:push      # create/update the SQLite tables
bun run dev          # http://localhost:3000
```

### First-time admin setup

1. Open the website and click the **Admin** button (top right).
2. The panel shows **"One-time setup: create the administrator account"**.
   Enter your email address and a password (min. 8 characters) — this email and
   password are yours only; they are never part of the source code.
3. After setup, sign in with the same credentials. The dashboard (Upload /
   Manage tabs) appears in the same modal.
4. **Log out** returns the panel to its locked sign-in state. The public
   library stays available at all times.

> **Hardening tip (recommended before you deploy publicly):** set the
> environment variable `ADMIN_SETUP_CODE` (any long random string). When it is
> set, the one-time setup form additionally asks for that code, so nobody else
> can claim the administrator account before you do. The account can be
> configured only once; the setup form disappears afterwards.

### Changing the admin account later

Stop the server and run:

```bash
sqlite3 db/custom.db "DELETE FROM Session; DELETE FROM AdminAccount;"
```

Then reload the site — the one-time setup form appears again.

---

## Deployment

### Option A — host with persistent disk (simplest, recommended)

Because uploaded files are stored on the server filesystem and the database is
a SQLite file, deploy to a platform that gives you a **persistent volume**
(e.g. Railway, Render, Fly.io, or any VPS). On Vercel's serverless platform the
filesystem is ephemeral — uploads and database writes would be lost between
deployments.

Typical steps (Railway/Render example):

1. Push this project to GitHub.
2. Create a new service from the repo.
3. Build command: `bun install && bun run db:push && bun run build`,
   start command: `bun run start` (or the platform's Node equivalent:
   `npm install && npx prisma db push && npm run build` + `npm run start`).
4. Attach a persistent volume mounted at `/app/db` (so both
   `db/custom.db` and `db/uploads/` survive restarts).
5. Set `ADMIN_SETUP_CODE` in the service's environment variables.
6. Open the site on your phone, click **Admin**, complete the one-time setup,
   and upload your first slide straight from your phone's Files app.

### Option B — Vercel + Supabase (your original plan)

Vercel is perfect for the frontend, but its filesystem is ephemeral and SQLite
won't persist. To run StudyShelf on Vercel exactly as designed, move the two
stateful pieces to Supabase:

1. **Create the Supabase project** at supabase.com (free tier is fine).
2. **Create the table** — SQL Editor:

   ```sql
   create table materials (
     id            uuid primary key default gen_random_uuid(),
     title         text not null,
     course_name   text not null,
     course_code   text not null,
     programme     text not null,
     level         text not null,          -- '100' | '200' | '300' | '400'
     semester      text not null,          -- 'Semester 1' | 'Semester 2'
     material_type text not null,
     description   text,
     lecturer      text,
     file_path     text not null,
     file_type     text not null,          -- 'pdf' | 'ppt' | 'pptx'
     file_size     bigint not null,
     downloads     bigint not null default 0,
     created_at    timestamptz not null default now(),
     updated_at    timestamptz not null default now()
   );
   ```

3. **Row Level Security** — allow everyone to read, only your authenticated
   admin to write:

   ```sql
   alter table materials enable row level security;

   create policy "public read" on materials
     for select using (true);

   create policy "admin write" on materials
     for all
     using (auth.role() = 'authenticated')
     with check (auth.role() = 'authenticated');
   ```

4. **Storage bucket** — create a bucket `studyshelf-materials`, then add
   storage policies: public `select` (downloads) for `anon`, and
   `insert` / `update` / `delete` only for the `authenticated` role.
5. **Create your administrator account** in Supabase → Authentication → Users
   (this is your authorized email + password; never share it).
6. **Deploy to Vercel**: import the repo, and adapt the small data layer
   (`src/app/api/**` + `src/lib/db.ts`) to use
   `@supabase/supabase-js` with the **anon/publishable key only** — the
   service-role key must never appear in frontend code.
7. Open the site on your phone, sign in through the same embedded Admin panel,
   and upload files from your phone's gallery or Files app.

All UI code (search, filters, cards, admin modal, upload form with progress)
is unchanged by this swap — only the data layer moves.

---

## Project structure

```
prisma/schema.prisma          # Material, AdminAccount, Session models
db/custom.db                  # SQLite database
db/uploads/                   # uploaded study files (server-side only)
src/app/page.tsx              # the single public page (library + admin)
src/app/layout.tsx            # metadata + toast provider
src/app/api/materials/        # public: list + download
src/app/api/admin/            # status, setup, login, logout, materials CRUD
src/lib/constants.ts          # programmes, levels, semesters, types, accepted files
src/lib/auth.ts               # scrypt hashing + DB sessions
src/lib/admin-guard.ts        # server-side authorization guard
src/components/studyshelf/    # header, hero, filters, cards, admin modal, forms
```

## Security summary

- Passwords are scrypt-hashed with per-account salts; never stored in plain
  text, never hardcoded, never sent back to the client.
- Sessions are random 48-byte tokens stored server-side (7-day expiry) with
  expired-session cleanup.
- Dual transport for the session: an httpOnly + SameSite=Lax cookie for normal
  top-level browsing, **plus an `X-Session-Token` request header** that the
  app attaches from `sessionStorage`. This keeps the admin panel working when
  the site is embedded (preview panels/iframes) or the browser blocks
  third-party cookies (e.g. Safari iOS). Token storage clears when the tab
  closes.
- Every mutating endpoint (`POST/PATCH/DELETE /api/admin/**`) verifies the
  session **on the server** (header or cookie) and returns 401 otherwise —
  hiding the admin UI alone is never the security boundary.
- Login is rate-limited (5 failed attempts → 10-minute lockout per IP).
- Uploads are validated server-side (extension whitelist + 50 MB cap +
  non-empty), and stored files are only reachable through the download API
  (never directly via `/public`).
- The file picker uses a native `<label>` + visually-hidden input, which opens
  the device file picker reliably on iOS Safari and Android.
- One-time setup can be additionally protected with `ADMIN_SETUP_CODE`.
- Downloads are counted and served with a sanitized `Content-Disposition`
  filename.
