# portal-service

Portal 241 — the school's public website, and the management area for its
content. NestJS + Prisma + PostgreSQL, NodeNext ESM — relative imports carry the
`.js` extension even though the source is `.ts`.

## Authoritative docs

Four documents govern this repo, in this order of precedence:

- `docs/CONSTITUTION.md` — the platform's binding principles. Everything above
  its SERVICE PROFILE heading is shared byte-for-byte with the other five
  services; below it is this service's own profile. Where it and any other doc
  disagree, **it wins**.
- `docs/ARCHITECTURE.md` — **start here for where code goes.** Part 1 is the
  Clean Architecture layering `src/portal/` is migrating to, with the measured
  current state and the conversion procedure. Part 2 is the service boundary.
  Its two *structure* sections supersede `NESTJS-RULES.md`'s.
- `docs/CLEAN-CODE.md` — **start here for what code looks like** once it is in
  the right place, worked through this service's real files rather than generic
  placeholders.
- `docs/NESTJS-RULES.md` and `docs/IAM.md` — the exhaustive coding rules and the
  authorization model, still binding except where
  the two documents above supersede them.

`.claude/skills/` carries six skills scoped to this repo — clean-architecture,
clean-code, nestjs-best-practices, domain-driven-design, code-review,
diagnosing-bugs — pinned in `skills-lock.json`.

**Neither is committed.** `.gitignore` keeps `.claude/`, `.specify/` and
`skills-lock.json` out of this repository — they are how it is worked on, not
what it ships, and nothing reads them at build or run time. A fresh clone will
not have them; re-fetch them from their sources. `CLAUDE.md` and `docs/` are
tracked and stay the thing to read first.

## The one service that serves a frontend

Every other extracted service answers an API and nothing else. This one also
serves the portal SPA, and that is deliberate rather than leftover:
`PortalHtmlController` answers `GET *` with `index.html` and **per-path metadata
injected before it leaves**. WhatsApp and Facebook crawlers do not execute
JavaScript, so without that every article on the site shares one identical share
card (research R3).

Three consequences, and all three are easy to break:

- **`PORTAL_DIST_PATH` is effectively required.** It used to default to
  `../apps/portal/dist`, which meant something because backend and frontend
  shared a workspace. Here the default is `./public`, and `public/README.md` says
  what belongs in it. What is checked in there today is a stand-in — the source
  `index.html` with its markers, not a build.
- **`PortalModule` must stay last in `app.module.ts`.** Its `PortalHtmlModule`
  answers `GET *`, and Nest matches controllers in registration order, so a
  module listed after it never receives a request. It is the only business module
  here, which makes the rule easy to satisfy and easy to forget.
- **The `<!-- speckit:meta:start/end -->` markers in `index.html` are load-bearing.**
  Everything between them is replaced per request. A path that resolves to
  nothing public falls back to them rather than 404ing.

## Three throttle buckets, all declared

`@PortalPublic()` does `SkipThrottle({ default: true, auth: true })` and
`Throttle({ 'portal-public': {} })`. A bucket it names must exist, and the two it
skips must exist to be skippable — so `auth` is declared here even though it
guards no route in this service.

Dropping it would not fail a build. It would silently put the public site on the
bucket sized for authenticated API traffic, and a class of students sharing one
NAT address on the school wifi would trip it within a minute (FR-027, SC-012).

## What it borrows

Thirteen Prisma models are portal's own, and **it reads none of identity-service's** —
no user lookup, no role read, no profile join. Its couplings are narrower than
any service but presence:

| Here | Why |
|---|---|
| `platform/auth` + `access-control`, verification only (19 files) | the management area is authenticated; the public site is not |
| `platform/file` (16 files) | portal is the only service that stores media, and `PortalFileUsageModule` registers the veto that stops a file being deleted while visible content references it |
| `platform/audit-log`, write side only | who published or unpublished what |
| `core/storage`, `core/cache` | signed media URLs, and the public response cache |

`core/cache` is kept here and in no other extracted service: `PortalCacheService`
injects `CACHE_MANAGER`, which needs a globally registered `CacheModule`.

## Two things that are load-bearing and easy to undo

**Public visibility is a read-time predicate**, defined once per model in
`*.where.ts` and composed by every public query, the homepage aggregator, the
sitemap, and the media authorization check. It is never a stored flag. A
hand-rolled filter anywhere else is a silent leak of unpublished content;
`test/portal-public-visibility.e2e-spec.ts` is the database-backed sweep that
catches it, and it is the one suite here that needs a real Postgres.

**Portal Pengumuman and Agenda are disjoint from SIAKAD's `Announcement` and
`Event`** (FR-046). Different tables, different lifecycles, different
permissions. A classroom announcement written for one class's parents appearing
on the public website is a privacy failure, not a feature — and it is exactly
what a well-meaning "reuse the existing model" refactor would introduce.
`src/portal/portal-siakad-disjointness.spec.ts` refuses any read of those models
from `portal/`, and it survived the split intact: those tables belong to
academic-service now, so the rule is enforced twice over.

## Authorization

ADR-0006 carved `portal-*` out of the ADMIN bypass first — before ADR-0008 did
the same for payroll and ADR-0011 deleted the mechanism. The reason was this
domain: a SIAKAD administrator is deliberately **not** a portal operator.
`PORTAL_EDITOR` holds `portal-*`; `SUPER_ADMIN` keeps the break-glass and nothing
else does.

> **`start:prod` deliberately does not run `prisma migrate deploy`.** This service
> shares a database it does not own.

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
administrators rather than a code change. `identity-service/src/iam/auth/types/jwt-token-payload.type.ts`
holds the measured numbers and the budget.

## Commands

```bash
pnpm install
pnpm prisma:generate
pnpm dev
pnpm validate      # format:check + lint + typecheck + lint:strict + test + build
pnpm test:e2e      # needs a real Postgres — portal-public-visibility seeds rows
```

`JWT_SECRET` must be byte-identical to identity-service's.
