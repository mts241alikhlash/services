# academic-service

SIAKAD 241 — academic structure and teaching: curriculum, classrooms,
schedule. NestJS + Prisma + PostgreSQL, NodeNext ESM — relative imports carry
the `.js` extension even though the source is `.ts`.

## Authoritative docs

`docs/NESTJS-RULES.md` (coding rules) and `docs/IAM.md` (how authorization
works, and which service owns it). Both still
binding, except that NESTJS-RULES.md's two *structure* sections are superseded
across this service's modules — see below.

Above both sits `docs/CONSTITUTION.md` — the platform's binding principles.
Everything above its SERVICE PROFILE heading is shared byte-for-byte with the
other five services; below it is this service's own profile. Where it and any
other doc disagree, **it wins**.

Two documents written for this repo:

- `docs/ARCHITECTURE.md` — **start here for where code goes.** Part 1 is the
  Clean Architecture layering this service's modules are migrated to, worked
  through `academic-setting` and `academic-year` as the two reference modules,
  plus the conversion procedure. Part 2 is the service boundary: what is
  borrowed from identity-service, the three couplings with current status, and the
  shared database. Read it before adding a module, touching a migrated one, or
  touching `platform/`, `presence/` or `prisma/`.
- `docs/CLEAN-CODE.md` — **start here for what code looks like**, once it's in
  the right place. A grounded walk through `NESTJS-RULES.md`'s recurring rules
  — the two Dto/Input/RepositoryInput crossings and why they're not symmetric,
  where a repository port's input type lives, comments, scoping, hygiene — each
  through a real file in `academic-setting`/`academic-year` rather than a
  generic placeholder.

`.claude/skills/` carries six skills scoped to this repo — clean-architecture,
clean-code, nestjs-best-practices, domain-driven-design, code-review,
diagnosing-bugs — pinned in `skills-lock.json`.

**Neither is committed.** `.gitignore` keeps `.claude/`, `.specify/` and
`skills-lock.json` out of this repository — they are how it is worked on, not
what it ships, and nothing reads them at build or run time. A fresh clone will
not have them; re-fetch them from their sources. `CLAUDE.md` and `docs/` are
tracked and stay the thing to read first.

## What this service owns

Academic Structure and Teaching & Timetable: academic-year, semester,
curriculum, subject, grade, classroom, calendar, academic-setting, schedule,
teaching-assignment, enrollment, and three reference-data lookups
(academic-calendar-type, occupation, semester-type) under
`src/reference-data/`. Every module sits directly under `src/` — not nested
inside an `academic/` folder, which was an artifact of the old layout removed on
2026-09-03 once this became its own bounded context.

`reference-data/` holds simple, mostly-static code/lookup tables
(`{id, name, isActive}`). That is the word every service uses for this shape —
see `docs/ARCHITECTURE.md` for where the line sits.

`src/core/` is infrastructure. `src/shared/` is a kernel — no business logic.
New modules are registered in `src/app.module.ts`.

**As of 2026-09-03, this is smaller than it was — twice over, the same day.**
`teacher` and the three staff reference-data lookups (employment-type, position,
position-category) were extracted to `hr-service`. `student`, `parent`,
`enrollment`, `graduation`, `semester-promotion`, and `semester-rollover` were
extracted to `student-service` — this repo kept a narrowed, read-only
`enrollment` slice because `schedule` still depends on it. Later the same day,
`assessment`, `attendance`, `report-card`, and `my-dashboard` were extracted
to `assessment-service`; unlike the first two extractions, this repo's own
`platform/school-unit-identity` and `presence/daily-record` — which existed
only for `report-card` and `attendance` — left with them rather than staying
behind as unused borrowed slices. All three are sibling repos under
`D:\Project\241 Apps\`. See `docs/ARCHITECTURE.md` Part 2 for the boundary:
**nothing here reads another service's tables through Prisma any more** — the
last eight foreign reads closed on 2026-09-09, and `platform/teacher-identity`,
`platform/teacher-lookup`, `platform/student-identity` and
`platform/student-lookup` are all HTTP adapters now.

## What it borrows, and from whom

Each borrowed piece is narrowed to a read or a single write. **None of them is
a second copy of the service that owns the real thing**, and keeping it that
way is the point:

| Here | What it may do | What was left behind |
|---|---|---|
| `platform/auth` | Verify a token, check the session is live | Login, refresh, logout, password reset, session cleanup — the whole controller, left in identity-service |
| `platform/access-control/permission` | `PermissionGuard` asking whether the caller holds a permission | Eight use cases, the controller, and the bootstrap hook that syncs the catalogue, left in identity-service |
| `platform/teacher-identity` | One method: which teacher record a signed-in user owns | Everything else about `Employee` — CRUD, bulk import, positions — left in `hr-service` since 2026-09-03 |
| `platform/student-identity` | One method: which student record a signed-in user owns | Everything else about `Student` — CRUD, bulk import, parents — left in `student-service` since 2026-09-03 |
| `platform/teacher-lookup` | `POST /employees/by-ids` — id, `userId`, NIP for a batch | The employee record itself |
| `platform/student-lookup` | `POST /students/by-ids` — id, `userId`, NIS for a batch | The student record itself |

The `*-identity` and `*-lookup` pairs answer opposite questions and are kept
apart on purpose: identity maps a signed-in account **to** a record for the
`/me` routes; lookup maps a record id **to** a name for a list. One HTTP
client, two ports.

`platform/user` and `platform/profile` are gone as of 2026-09-03: both existed
only for `teacher`/`student`/`parent`, which no longer live here. `platform
/school-unit-identity` and `presence/daily-record` are gone as of the same
day's second extraction: both existed only for `report-card` and `attendance`,
which moved to assessment-service along with them. If a controller here would
answer the same URL as one in another service, it does not belong here. That
is the rule the trimming followed throughout.

## Three couplings, and what each costs

The full, current status of all three — and the exact HTTP contract for
whichever one is being closed next — lives in `docs/ARCHITECTURE.md` Part 2,
kept in sync with the code every time a coupling's status changes. Do not
duplicate that table here; it drifts. The short version as of 2026-09-03:

1. **Authorization reads identity-service's tables** — reduced since 2026-08-30,
   not removed. Session liveness still does.
2. **Provisioning writes them** — closed, end to end, since 2026-09-03.
   `hr-service` and `student-service` (the callers now — this repo has
   neither `teacher` nor `student` any more) call identity-service's
   `POST /accounts` / `DELETE /accounts/:userId`, guarded by a shared
   `PROVISIONING_SERVICE_TOKEN`.
3. **Rosters join to `profiles`** — closed as of 2026-09-09. All four consumers
   go through `platform/profile-lookup`'s cached batch HTTP call; `prisma/`
   declares no `Profile` and the three `USER_*_SELECT` constants are gone. The
   before/after measurement the section below asks for was still never taken —
   that debt is real, but it is now a performance question rather than a
   correctness one, because the tables are no longer reachable to join.

Two things above are new since the modules that used to carry them moved out
on 2026-09-03: `POST /students/enrol` (the transaction that wrote a student,
profile, parents, address, grant, and enrolment together) does not exist in
this repo any more — it now lives in `student-service`. Hiring a teacher or
enrolling a student no longer writes an IAM account **here** at all; that
provisioning call happens in whichever of the two new services owns the
record now.

### Therefore: its own database, and it owns the schema

**This changed on 2026-09-09, and again later the same day.** This service
points at its own `DATABASE_URL` (`academic_service`), and `prisma/` declares
**21 models** — not the 119 of the shared schema it used to mirror, and no
longer the 24 it had at the first cut. It was 20 until `Education` arrived
here on 2026-09-09, having been declared by admission-service and
student-service and owned by neither.

`Teacher` and `Student` were the last two to go. Neither was read by a
`prisma.x` call — which is why three scans missed them — but four modules
joined `teachers` (`classroom`, `schedule`, `subject`, `teaching-assignment`,
each only to reach `userId` and render a name), `classroom_structures` joined
`students` for the four class officers, and `Occupation._count` counted
`parents`. All of them go through `platform/teacher-lookup`,
`platform/student-lookup` and `platform/parent-lookup` now.

`student_enrollments` and `parents` went with them: both were declared and
never touched at all.

The lesson worth keeping: **a foreign table can be reached by an `include`, a
relation `where`, an `orderBy` through a relation, or a `_count.select`.** A
scan for `prisma.<model>` finds none of those.

`prisma/` declares no `User`, no `Profile`, no `AuthSession`; the three
`USER_*_SELECT` constants are gone, and no repository joins `profile`. Session
liveness and grants come from `platform/identity` over HTTP; roster names come
from `platform/profile-lookup` the same way.

So `prisma migrate` **does** belong to this service now, and `prisma:migrate` /
`prisma:deploy` exist for it. The one rule kept from before:

> **`start:prod` still does not migrate.** Migration is an explicit deploy
> step, not something a container does on boot — two replicas starting at once
> would otherwise race each other through the same migration.

The previous text here said the opposite, and said it for a good reason at the
time: while eight services shared one database and each described only part of
it, Prisma treats its schema as the whole truth, so any `migrate` would have
dropped the other services' tables. That hazard is gone with the shared
database.

## Closing the couplings, in order

1. ~~**Put roles and permissions in the access token.**~~ Done 2026-08-30.
   `PermissionGuard` reads a claim instead of four tables. Cost: a revoked
   grant lasts until the access token expires (15 minutes). Still reduced
   rather than fully removed — see "Authorization no longer reads
   identity-service's tables" below for why.
2. ~~**Make provisioning an HTTP call** to identity-service.~~ Done
   2026-09-03, but not by this repo: the modules that used to carry
   provisioning (`teacher`, `student`) were extracted to `hr-service`
   and `student-service` the same day, and each stood up its own
   `HttpAccountProvisioningAdapter` calling identity-service's
   `POST /accounts` / `DELETE /accounts/:userId`. This repo has neither
   module left to provision an account for.
3. **Replace the profile join** with a batch lookup against identity-service,
   cached. **In progress as of 2026-09-03, one consumer done, three left, not
   yet measured.** identity-service now answers `POST /profiles/batch`,
   guarded by `ProvisioningTokenGuard` the same way `/accounts` is.
   `platform/profile-lookup/` (global — every roster reaches it) is a
   `HttpProfileLookupAdapter` calling it, caching each resolved profile by
   `userId` for `PROFILE_LOOKUP_CACHE_TTL_MS` (60s default; 0 disables it) —
   the same trade `inventory-service`'s `HttpIdentityAdapter` makes for
   session tokens, applied per-profile so two different rosters asking about
   the same teacher share a cache hit.

   `teaching-assignment` is converted: `PrismaTeachingAssignmentRepository`
   no longer joins `teacher.user`, and batches one `resolveUserRefs()` call
   (`shared/utils/resolve-user-refs.helper.ts`, written to be reused by the
   rest) per query instead. Every existing test passes unchanged — the
   port's return shape (`TeachingAssignmentWithDetails`, hand-written in the
   domain layer, not Prisma-inferred) never described the join in the first
   place, so nothing downstream had to change.

   **Not yet done, and this matters: no before/after measurement exists.**
   This dev environment has no reachable database and no reachable
   identity-service to measure against — `pnpm test` mocks every dependency,
   and `app.module.boots.spec.ts` only proves the DI graph resolves, never
   opens a connection. The doc's own caution against trading a working hot
   path for an unmeasurable one is not satisfied by "it typechecks and the
   tests pass." Before rolling this out to `classroom`, `schedule`, and
   `enrollment` — the other three consumers of `USER_REF_SELECT`/
   `USER_ROSTER_SELECT`/`USER_DISPLAY_SELECT` — measure `teaching-assignment`'s
   real latency against a real identity-service with realistic roster sizes,
   the same way coupling 1's reduction was measured with `log_statement='all'`.
   If it regresses the hot path, the fix is tuning the cache TTL or batching
   more aggressively, not reverting silently.

All three are now closed, the database is separate, and `prisma migrate`
belongs to this service — see "Therefore: its own database" above. What is
still outstanding from item 3 is only the measurement, not the conversion.

## Authorization rules (unchanged)

Permissions, never role names — `@RequirePermissions('students.create')`, module
segment plural. Exactly one role bypasses, `SUPER_ADMIN`, inside
`PermissionGuard` itself, and that check must not be copied anywhere else
(ADR-0011). `src/single-role-bypass.spec.ts` is the sweep that enforces it; its
allowlist is six entries shorter than it once was because the files
that named `SUPER_ADMIN` in order to *withhold* something are identity-service's.

## Authorization no longer reads identity-service's tables

As of 2026-08-30 the access token carries the caller's `roles` and (when they
fit) `permissions`, and `PermissionGuard` reads them from `request.user` instead
of querying. Measured with `log_statement='all'` over ten authenticated
requests: `user_roles`, `role_permissions` and `permissions` were queried **zero
times**, where each request previously cost three reads into tables this service
does not own.

Two things did **not** change, and both are deliberate:

- **Session validation still reads `auth_sessions` and `users`** on every
  request. That is a different question — *is this session still live and this
  account still active* — and answering it from a token would mean a revoked
  session kept working until expiry. Revocation should be immediate.
- **The fallback is still here.** `IPermissionRepository` remains wired, because
  a token can arrive without permissions: one minted before this change, or a
  caller whose list exceeded the header budget. SUPER_ADMIN is the standing
  example — 262 grants, about 8.1KB encoded, over Nginx's default 8k buffer — and
  it never needs them, because the guard decides its bypass on the role.

So the coupling is **reduced, not removed**. Removing it entirely means capping
what one role may hold, which is a decision about how the school arranges its
administrators rather than a code change. `identity-service/src/auth/types/jwt-token-payload.type.ts`
holds the measured numbers and the budget.

## A time slot type carries how long its slots run

`TimeSlotType.defaultDurationMinutes` was added on 2026-09-11 — 40 by default,
1 to 600 accepted. A lesson is 40 minutes, a break 15, a ceremony 60, and the
timetable screen had been making whoever built it type both ends of every row
by hand.

The name says `default` on purpose: **it fills in the end time when a slot is
added, and constrains nothing that is already saved.** A Friday lesson that
runs 35 minutes stays 35 minutes; nothing recomputes a stored `TimeSlot` when
its type changes. Storing a length on the type and a length on the slot would
be two sources for one fact, and the slot is the one the timetable actually
reads.

It is the first migration in this service after the init one:
`prisma/migrations/20260911000000_time_slot_type_duration/`, a single
`ADD COLUMN ... NOT NULL DEFAULT 40`, additive and safe on a populated table.

## Commands

```bash
pnpm install
pnpm prisma:generate          # required before anything else
pnpm seed:school-life         # reference lists
pnpm seed:timetable
pnpm seed:academic-activity
pnpm dev
pnpm validate                 # format:check + lint + typecheck + lint:strict + test + build
```
