# StudyShelf — Shared Worklog

---
Task ID: 1
Agent: main orchestrator
Task: Inspect project, define Prisma schema, shared constants/types, prepare deps

Work Log:
- Inspected package.json (Next.js 16, @tanstack/react-query, sonner, lucide-react, full shadcn/ui set all present), dev server already running on port 3000.
- Rewrote prisma/schema.prisma with three models: Material, AdminAccount, Session (SQLite at db/custom.db).
- Ran `bun run db:push` — schema synced, Prisma Client generated.
- Created src/lib/constants.ts (PROGRAMMES, LEVELS 100–400, SEMESTERS, MATERIAL_TYPES, ACCEPTED_FILE_TYPES pdf/ppt/pptx, MAX_FILE_SIZE_MB=50).
- Created src/lib/types.ts (Material, CourseFacet, MaterialsResponse, AdminStatus).
- Created db/uploads/ directory for stored files.

Stage Summary:
- Database + shared contract are in place. API agents build on: `import { db } from '@/lib/db'`, constants in '@/lib/constants', types in '@/lib/types'.
- File storage directory: `<project>/db/uploads` (server-side only, never public/).
- Cookie name for admin session: `studyshelf_session`.

---
Task ID: 2-a
Agent: full-stack-developer
Task: Build the complete StudyShelf backend — auth/session helpers, file storage helpers, validation, and all 8 API route handlers (public browse/download + admin auth + admin material CRUD)

Work Log:
- Read worklog.md, prisma/schema.prisma, src/lib/db.ts, constants.ts, types.ts to align with the shared contract.
- Created src/lib/auth.ts: scrypt password hashing (salt:hash format, timingSafeEqual verify), DB-backed session create/get/destroy (7-day expiry, expired-session cleanup on create), SESSION_COOKIE_NAME="studyshelf_session", SESSION_MAX_AGE=604800.
- Created src/lib/material-files.ts: UPLOAD_DIR=<cwd>/db/uploads, getExtension/isAcceptedExtension/generateStoredFileName, saveUploadFile (ext+size+empty validation with friendly errors, mkdir -p, buffer write), resolveStoredFilePath (rejects '/', '\', '..'), readStoredFile, deleteStoredFile (best-effort), sanitizeDownloadName ("CSC201-Data-Structures.pdf" style).
- Created src/lib/admin-guard.ts: requireAdmin(req) → { account } | null from session cookie.
- Created src/lib/material-validation.ts: validateMaterialFields(fields, {partial}) — required title/courseName/courseCode + enum checks against PROGRAMMES/LEVELS/SEMESTERS/MATERIAL_TYPES, optional description(≤1000)/lecturer(≤120) with "" → null; returns { ok, data | error }.
- Created public routes: GET /api/materials (search OR-contains on 5 fields + exact filters programme/level/semester/course→courseCode/type→materialType; returns materials desc + distinct courses + unfiltered stats), GET /api/materials/[id]/download (awaited Promise params, 404s, downloads increment, correct Content-Type per fileType, no-store, ascii+UTF-8 Content-Disposition).
- Created admin routes: GET /api/admin/status (needsSetup + requiresCode + authenticated), POST /api/admin/setup (one-time, 403 if exists, optional ADMIN_SETUP_CODE gate, email regex + password ≥8 + match), POST /api/admin/login (per-IP in-memory rate limit: 5 fails → 10-min lock, 429; sets httpOnly/sameSite=lax/secure-in-prod cookie), POST /api/admin/logout (destroys session, clears cookie, never errors).
- Created admin material routes: POST /api/admin/materials (multipart, admin-guard 401, field validation, saveUploadFile, 201 with created Material), PATCH+DELETE /api/admin/materials/[id] (PATCH accepts JSON metadata-only or multipart with optional file replacement incl. old-file cleanup; DELETE removes file + row; both 401/404 guarded).
- All routes export dynamic='force-dynamic' and runtime='nodejs'; all errors are { error: "<friendly message>" } via NextResponse.json.
- Fixed TS strict issues: replaced non-existent Session→AdminAccount Prisma include (no relation in schema) with two-step lookup; used typed Prisma.MaterialUpdateInput in PATCH.
- Smoke-tested the full flow on the running dev server via curl: setup → login → status(authenticated) → upload → filtered list → download (headers+file verified) → JSON PATCH → multipart PATCH file-replace → 401 guards → validation 400 → DELETE → logout; then removed the smoke-test admin account, sessions, material and uploaded files so the app returns to pristine needsSetup=true.
- bun run lint and tsc --noEmit pass clean for all files under src/ (remaining tsc errors are pre-existing in examples/ and skills/, not mine).

Stage Summary:
- Backend complete and verified end-to-end. 8 endpoints: GET /api/materials, GET /api/materials/[id]/download, GET /api/admin/status, POST /api/admin/setup, POST /api/admin/login, POST /api/admin/logout, POST /api/admin/materials, PATCH+DELETE /api/admin/materials/[id].
- Helpers for the frontend agent: import { requireAdmin } from '@/lib/admin-guard'; cookie name 'studyshelf_session'; all error responses are { error } with UI-ready messages; AdminStatus.requiresCode reflects ADMIN_SETUP_CODE env var.
- Decision: auth.ts uses two queries (session then account) because prisma/schema.prisma defines accountId as a plain column without a Prisma relation — schema was off-limits; behavior is identical.
- Database left in clean first-run state (0 admin accounts, 0 sessions, 0 materials, empty db/uploads).

---
Task ID: 2-b
Agent: frontend-styling-expert
Task: Build the StudyShelf frontend UI (public library + admin modal) against the agreed API contract

Work Log:
- Read worklog.md, constants.ts, types.ts and all shadcn ui primitives to confirm APIs; verified dev server on :3000.
- globals.css: overrode :root shadcn tokens — --primary/--ring to oklch(0.28 0.06 260) (navy), --primary-foreground to oklch(0.98 0 0); radius already 0.625rem. No gradients; flat academic look.
- layout.tsx: set StudyShelf metadata (title/description), kept Geist fonts, swapped old toaster for sonner <Toaster richColors position="top-center" />.
- page.tsx: 'use client' composition root — QueryClientProvider with useState(() => new QueryClient({ staleTime: 10_000, refetchOnWindowFocus: true })) wrapping StudyShelfPage.
- Created src/lib/format.ts: humanFileSize (B/KB/MB/GB, 1 decimal), formatUploadDate (en-GB "12 Jan 2025"), validateMaterialFile (extension + 50MB checks, shared by upload/replace).
- Created src/components/studyshelf/api.ts: MaterialFilters + DEFAULT_FILTERS, hasActiveFilters, buildMaterialsUrl (omits "all" params), fetchMaterials, fetchAdminStatus (parse {error} shape), invalidateMaterialQueries (invalidates ['materials'] + ['admin-materials']).
- Created components: header (sticky, navy logo square, outline Admin button h-11 mobile), hero (navy h1, welcome copy, BookOpen/Download stat chips from stats), search-filters (search input with 300ms debounce via local state + useEffect timer; 5 selects grid-cols-2 sm:3 lg:6; ghost Clear filters when active; h-11 touch targets — SelectTrigger uses h-11! to beat data-[size=default]:h-9), material-card (file-type badge red/amber, navy title, courseCode chip, meta chips, description/lecturer, file meta + download <a> button; export from format.ts), materials-grid (6 skeletons / error retry box / empty vs no-results states / responsive grid), footer (mt-auto navy, tagline, © year, safe-area padding).
- Admin modal (admin-modal.tsx): controlled Dialog w-[calc(100vw-2rem)] max-w-lg max-h-[92dvh] overflow-y-auto; three states driven by ['admin-status'] query (enabled when open): FirstTimeSetup (with conditional setup-code field, client validation, POST /api/admin/setup), LoginForm (destructive Alert with API error, POST /api/admin/login), AdminDashboard (Tabs Upload/Manage + "Signed in as {email}" + Log out → POST /api/admin/logout). Skeleton while loading, retry state on status error. Closing never logs out.
- upload-material-form.tsx: FilePicker (shared file-picker.tsx, dashed drop-zone button + selected-file box), shared material-form-fields.tsx (prominent 4-button Level selector min-h-12, Title, Course name/code, Programme/Semester/Type selects, Lecturer, Description); XHR upload with xhr.upload.onprogress → shadcn Progress + "Uploading… N%"; disables submit while uploading; success → toast + reset (keeps level) + invalidate both query keys; {error} parsing + network fallback.
- manage-materials.tsx: level Tabs (All/100/200/300/400) → useQuery(['admin-materials', level]); scrollable row list (title, code·level·semester·size, Pencil/FileUp/Trash2 h-9 icon buttons); nested Dialogs for Edit (PATCH multipart, all text fields, prefilled shared fields component) and Replace file (PATCH multipart with file only); AlertDialog for delete confirmation; toasts + invalidations everywhere.
- Fixed lint: replaced effect-based input sync in SearchFilters with local clearing in the clear handler (react-hooks/set-state-in-effect); `bun run lint` now clean; `tsc --noEmit` clean for src (only pre-existing errors in examples/, skills/).
- Verified live: GET / 200; /api/materials and /api/admin/status match MaterialsResponse/AdminStatus exactly; compiled CSS contains navy --primary (#172846 form) and h-11! rule.

Stage Summary:
- Frontend complete: 13 files (2 edited: layout.tsx, page.tsx; globals.css tokens; 10 new under src/components/studyshelf/ + src/lib/format.ts). No API routes created; all fetches relative; no forbidden files touched.
- Query keys: ['materials', filters] (public, keepPreviousData), ['admin-materials', level] (manage list), ['admin-status'] (enabled only while admin modal open). Upload/edit/replace/delete invalidate ['materials'] + ['admin-materials']; login/logout/setup invalidate ['admin-status'] via onStatusRefresh.
- Design tokens: navy oklch(0.28 0.06 260) as shadcn --primary/--ring → all buttons/rings navy automatically; white bg, slate-50 cards, footer mt-auto navy with safe-area inset.
- Orchestrator should verify: upload flow end-to-end (needs a seeded admin or run setup with ADMIN_SETUP_CODE if set — UI hides the code field while requiresCode=false), download link /api/materials/{id}/download, and nested dialogs stacking inside the admin modal on small screens.

---
Task ID: 4
Agent: main orchestrator
Task: End-to-end verification (curl + agent-browser) and fixes

Work Log:
- 19 curl API tests: setup (one-time, 403 on repeat), login (401 bad pw, 429 rate-limit in code), unauth upload/delete -> 401, upload multipart, filtered lists, search, download (correct headers + bytes + download counter), JSON PATCH, multipart file-replace PATCH, DELETE, logout invalidates session.
- Browser verification (agent-browser): page renders (title, hero, stats, search + 5 filters, cards, navy sticky footer); login error message shown for wrong password; successful sign-in shows Upload/Manage dashboard; browser file upload of a PPTX with level 200 + all fields -> success toast, material appeared instantly in public library without refresh; download link click incremented counter; Manage tab level tabs filter correctly; Edit dialog prefilled and saved (semester change persisted); Replace/Delete verified (delete had confirmation AlertDialog); logout returned locked sign-in state with public library unaffected; no console errors; mobile 390x844 layout verified (sticky header, 2-col filters, full-width download button, admin modal usable).
- Reset DB to pristine first-run state: wiped test materials, admin account, sessions, and uploaded files. GET /api/admin/status now returns needsSetup:true so the USER creates their own credentials.

Stage Summary:
- All golden paths verified end-to-end in a real browser. Site left clean: empty library + one-time admin setup pending for the owner.

---
Task ID: 5
Agent: main orchestrator
Task: Documentation, cleanup, final checks

Work Log:
- Wrote README.md: quick start, first-time admin setup, ADMIN_SETUP_CODE hardening, admin reset procedure, deployment Option A (persistent-disk hosts) and Option B (Vercel + Supabase with SQL schema, RLS + storage policies, admin account creation), security summary.
- Final `bun run lint` clean; dev server 200; API smoke tests green after reset.

Stage Summary:
- StudyShelf complete and verified. User must do: open site -> Admin -> one-time setup (email + password of their choice, never shared with the assistant).

---
Task ID: 6
Agent: main orchestrator
Task: Fix admin panel not unlocking after successful login + mobile file picker

Work Log:
- Diagnosis: user account existed and 7 server-side sessions had been created — login succeeded every time, but the browser dropped the SameSite=Lax session cookie inside the embedded preview iframe (third-party-cookie blocking). /api/admin/status then returned authenticated:false, so the modal stayed on the login form despite the success toast.
- Server fix: admin routes now accept the session token via X-Session-Token header OR cookie (src/lib/admin-guard.ts requestSessionToken). /api/admin/login and /api/admin/setup return the token in JSON; setup now auto-signs-in. Logout destroys header or cookie sessions.
- Client fix: new src/lib/session.ts (sessionStorage token + in-memory fallback, adminFetch wrapper). Login/setup store the token and optimistically setQueryData(['admin-status']) so the dashboard unlocks INSTANTLY. All admin calls (status, upload XHR, PATCH, DELETE, logout) send the token; 401 clears token and returns to the sign-in form with a clear message.
- File picker fix: replaced display:none input + JS .click() with a native <label htmlFor> + sr-only input (works on iOS Safari/Android), with a "Change" label and improved selected-file row.
- Verified: curl (login returns 96-char token; status/upload/delete work with header only; invalid token rejected). Browser top-level: login -> instant dashboard -> upload -> instant library update -> logout. Browser cross-origin iframe: login -> dashboard -> COOKIES CLEARED -> reload -> still authenticated -> cookie-less upload succeeded -> logout locked.
- Cleanup: removed test admin account, its sessions, all test materials/files. User account (twumampofosamuel2@gmail.com) and library left pristine (0 materials). Lint clean.

Stage Summary:
- Root cause was cookie loss in embedded/iframe contexts; now auth is dual-transport and works everywhere. Setup also auto-signs-in. Mobile file picking is iOS-safe.
