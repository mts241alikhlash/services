# identity-service

Identity and access management for the 241 platform. NestJS + Prisma +
PostgreSQL, NodeNext ESM — relative imports carry the `.js` extension even
though the source is `.ts`.

## Authoritative docs

- `docs/CONSTITUTION.md` — the platform's binding principles. Everything above
  its SERVICE PROFILE heading is shared byte-for-byte with the other five
  services; below it is this service's own profile. Where it and any other doc
  disagree, **it wins**. Read its Principle VII before running any Prisma
  command here.
- `docs/ARCHITECTURE.md` — **start here for where code goes.** Part 1 is the
  Clean Architecture layering every module in this service has now converted
  to (2026-09-03) — read it for the target shape and the conversion procedure
  a future module split would reuse. Part 2 is the service boundary: what
  this service publishes to others, and the partial-schema hazard. Its two
  *structure* sections supersede `NESTJS-RULES.md`'s.
- `docs/CLEAN-CODE.md` — **start here for what code looks like** once it is in
  the right place, worked through `user`, `auth` and `access-control` as real
  files rather than generic placeholders.
- `docs/IAM.md` — the design this service implements, for the six identity
  modules below. It has never been rewritten — its module tree does not list
  `notification`, and it does not know about `school-unit` at all. `CLAUDE.md` and `ARCHITECTURE.md` are the current
  source of truth for what this repo actually has; treat `IAM.md` as
  authoritative for authorization *behaviour* only, per its own doc order in
  `ARCHITECTURE.md`.
- `docs/NESTJS-RULES.md` — coding rules. Still binding.

`.claude/skills/` carries six skills scoped to this repo — clean-architecture,
clean-code, nestjs-best-practices, domain-driven-design, code-review,
diagnosing-bugs — pinned in `skills-lock.json`.

**Neither is committed.** `.gitignore` keeps `.claude/`, `.specify/` and
`skills-lock.json` out of this repository — they are how it is worked on, not
what it ships, and nothing reads them at build or run time. A fresh clone will
not have them; re-fetch them from their sources. `CLAUDE.md` and `docs/` are
tracked and stay the thing to read first.

A doc whose work is finished is deleted, not archived: git history is the
archive, and a stale doc that contradicts the code misleads every reader.

## What this service owns

Six identity modules, each sitting directly under `src/` — not nested inside
an `iam/` folder, which was an artifact of the old layout removed on
2026-09-03 once this became its own bounded context — plus one that is not
identity at all:

| Module | What |
|---|---|
| `auth/` | Sign-in, refresh, `GET /auth/me`, password reset, `JwtAuthGuard`, nightly session cleanup |
| `access-control/` | `role/` and `permission/`, the permission catalogue, `PermissionGuard` |
| `user/` | Accounts, and provisioning an account together with its profile |
| `session/` | Active sessions, revocation |
| `audit-log/` | Who did what |
| `notification/` | Password-reset email only — it is here because `auth` requires it |
| `school-unit/`, `reference-data/school-unit-type/` | The institution's own record — name, address, contact, social media, type. Moved here from academic-service on 2026-09-03; see "The school-unit exception" below. |
| `profile/` | The person behind the account — name, NIK, gender, birth, contact, religion, blood type, **and their address**. Added 2026-09-11. |
| `reference-data/region/` | The Kemendagri administrative area tree, for the address form. Added 2026-09-11. |

`src/core/` is infrastructure (config, database, decorators, filters,
interceptors, logger, health). `src/shared/` is a kernel — helpers, types, DTOs,
no business logic. `src/types/` holds ambient declarations only. New modules are
registered in `src/app.module.ts`.

A single `PlatformModule` once bundled twenty-one modules. Announcement,
dashboard, file, notification-beyond-reset, settings, five staff/student
reference-data lookups, and the six-level profile graph are platform features
rather than identity, and they stayed behind. `school-unit` was also one of
the twenty-one — it is the one exception that came back; see below.

## The school-unit exception

Every other non-identity piece of that `PlatformModule` stayed out
on purpose — this repo is identity, not "everything platform-shaped."
`school-unit` is here anyway, moved from academic-service on 2026-09-03,
because it fails the same test differently: it is institution config that
every service will eventually need to read (report cards, presence exports,
the public site, admission forms), and every service already calls this one
for auth. Adding a `school-service` for one small, rarely-changing record
would mean every consumer learns a second address instead of reusing the
one it already has.

It brought its own `reference-data/school-unit-type/` with it — a lookup
table for `school-unit`'s `typeId`, split out the same way this service's
existing `reference-data/` pattern (once it has more than this one entry)
would expect, not left bundled inside `school-unit/` where it started in
academic-service.

`SchoolUnit`, `SchoolUnitType`, `SchoolUnitSocialMedia`, `Address`, and
`SocialMedia` are now declared in `prisma/school-unit.prisma`. `Address` and
`SocialMedia` are narrowed to the one relation this service actually
queries (`schoolUnit`) — the columns for student/teacher/parent addresses
and profile social media still exist on the same physical rows, this
client's schema just does not describe them, the same narrowing this
service already applies to every other table it does not fully own.

academic-service kept only a three-field read (`platform/school-unit
-identity`, matching `teacher-identity`/`student-identity`'s shape) for its
report card PDF header — the only thing there that still needed it.

## Two rules that are the whole point of the split

**This service owns `users`, and nothing joins to it from outside.** `User`
used to be the hub of the schema — twelve schema files held a foreign key into
it, twenty-seven relation fields in all. `prisma/auth.prisma` now
declares six. A service that needs to name the person behind a `userId` asks
over HTTP; it does not join. Referential integrity across that line was given up
deliberately, and getting it back by adding a relation would undo the split.

**This service has its own database and ships `prisma:migrate` /
`prisma:deploy`.** That inverted on 2026-09-09: `identity_service` is its own
database, `prisma/` describes all **20** models in it, and nothing else writes
there. The paragraph that used to sit here — warning that a `migrate deploy`
would drop 103 tables belonging to other services — described a shared database
that no longer exists.

`start:prod` does not migrate. Migration is an explicit deploy step.

## Authorization

Permissions, never role names — `@RequirePermissions('users.create')`, module
segment plural. Exactly one role bypasses the check: `SUPER_ADMIN`, as
break-glass, inside `PermissionGuard` itself. That check must not be copied
anywhere else, and `src/single-role-bypass.spec.ts` is the sweep that says so
(ADR-0011). `ADMIN` bypassed too until 2026-08-15; it no longer does.

The permission catalogue and `STRUCTURAL_ROLES` ship with the code and are
synced at bootstrap. Production is populated through the UI and never runs a
seed, so a permission that exists in code but not in the database cannot be
granted at all — it simply does not appear on the role screen, with nothing to
explain why.

## The guard the split broke

`src/access-control/role/domain/depended-on-roles.spec.ts` used to prove
that every role resolved by name somewhere in the backend was protected from
deletion. Three of those roles — `TEACHER`, `STUDENT`, `APPLICANT` — are now
resolved by `academic-service` and `admission-service`, which this repository
cannot open.

`requiredBy` therefore gained a `Cross-service — <service>: <file>` shape, and
the sweep checks that shape rather than pretending to verify the file. **Deleting
`TEACHER` on the role screen still breaks academic-service, and nothing here
will go red.** Closing that needs a check spanning repositories. It is written
down rather than fixed, which is the honest state.

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

## The profile photo, and why storage is optional here

`POST /profiles/me/photo` and `DELETE /profiles/me/photo` arrived on
2026-09-11, with `src/core/storage/` copied from the pattern portal-service and
admission-service already use — MinIO through the S3 SDK, `forcePathStyle`, and
a second client for presigning when `S3_PUBLIC_ENDPOINT` differs from
`S3_ENDPOINT`.

**One thing is deliberately different here: the `S3_*` variables are
optional.** In portal-service and admission-service they are required, and the
service refuses to boot without them — storage *is* what those services do. In
this one, storage is a profile photo. **Signing in must never depend on MinIO
being up**, so `StorageService` starts unconfigured, logs a warning, and the
two photo endpoints answer **503** while everything else works normally.

`GET /profiles/*` now returns **`avatarUrl`**, a presigned GET valid for
`S3_SIGNED_URL_EXPIRY_SECONDS`, alongside the raw `storageKey`. The service
that owns the file owns its URL; the earlier note telling callers to resolve
the key themselves is gone.

Uploads are bounded at the use case, before anything reaches storage: **JPEG,
PNG, WebP or AVIF only, 2 MB at most.** `image/svg+xml` is refused on purpose —
an SVG is a document that can carry script, and it would be served back from
our own origin. The object is written **before** the row, and the replaced
object is deleted **after** the row points at the new one, so a crash leaves an
orphaned object rather than a profile pointing at a file that is not there.

## Google sign-up, opt-in, and what the `state` carries

`GET /auth/google` has always taken a `redirect` origin. It now also takes an
`intent`, and the two travel to Google in `state` as URL-safe base64 of
`{"origin":"...","intent":"signin"|"signup"}`. A `state` that is a bare origin,
which is everything feature 001 issued and anything already in flight, decodes as
`{"origin": ..., "intent": "signin"}`, so sign-in is unchanged. The callback
decodes `state` first and hands **only the decoded origin** to the allowlist
check; the encoded blob is never validated as if it were an origin.

`GOOGLE_SIGNUP_ENABLED` (default `false`) turns `intent: "signup"` into account
creation. It is parsed as `z.enum(['true','false'])`, **not** `z.coerce.boolean()`,
because the latter reads the string `"false"` as truthy, which would enable
sign-up on a deployment that explicitly turned it off.

| Account | Flag | Result |
|---|---|---|
| unknown email, `signup` | `false` | nothing created, no session, `oauthOutcome=signup-disabled` |
| unknown email, `signup` | `true` | user + `UserRole(APPLICANT)` in one `prisma.user.create`, `oauthOutcome=signup-created` |
| known email, either intent | n/a | signs in, `oauthOutcome=signup-existing` |

`oauthOutcome` rides back to the SPA as a query parameter on the callback
redirect. `signup-disabled` is the one case that also changes the target: it
lands on `<origin>/?signup=1` and sets **no** refresh cookie, so a refusal never
leaves a half-signed-in browser behind. The other outcomes append `oauthOutcome`
to the normal callback URL and set the cookie as before.

The role is written inside the same create, so a sign-up that cannot resolve
`APPLICANT` fails outright rather than leaving a roleless account. Account
creation and application creation are separate services: identity-service makes
the account, then admission-web calls admission-service's idempotent
`POST /admissions/my-application/ensure`.

## Commands

```bash
pnpm install
pnpm prisma:generate          # required before anything else
pnpm prisma:migrate           # dev migration
pnpm seed:iam                 # roles + permission catalogue
pnpm seed:admin-minimal       # one account, SUPER_ADMIN — the smallest usable state
pnpm seed:profile-references  # religions + blood types
SEED_REGIONS_FILE=../wilayah.sql pnpm seed:regions
pnpm dev
pnpm validate                 # format:check + lint + typecheck + lint:strict + test + build
```

`seed:regions` reads `wilayah.sql` from
[cahyadsn/wilayah](https://github.com/cahyadsn/wilayah) — Kepmendagri
300.2.2-2430/2025, ~83k rows — or any file of `code,name` lines. It is an
upsert, so re-running it after next year's Kepmendagri updates the names in
place and keeps every code an address already points at.

`pnpm-workspace.yaml` exists even though this is a single package: pnpm 11 reads
`overrides` and `allowBuilds` from there, and silently ignores them in
`package.json`.
