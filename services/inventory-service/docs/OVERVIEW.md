# inventory-service

SIMAS 241 — asset management: assets and their units, circulation (loans and
returns), and the approval workflow. NestJS + Prisma + PostgreSQL, NodeNext ESM —
relative imports carry the `.js` extension even though the source is `.ts`.

## Authoritative docs

Four documents govern this repo, in this order of precedence:

- `docs/CONSTITUTION.md` — the platform's binding principles. Everything above
  its SERVICE PROFILE heading is shared byte-for-byte with the other five
  services; below it is this service's own profile. Where it and any other doc
  disagree, **it wins**.
- `docs/ARCHITECTURE.md` — **start here for where code goes.** Part 1 is the
  Clean Architecture layering `src/inventory/` is migrating to, with the measured
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

## The least entangled service of the three

This is worth stating plainly, because it decides how much of the platform came
along:

- **Nothing outside this service imports `inventory/`.** Zero reverse dependencies.
- **`inventory/` imports no other business domain.** No academic, no presence, no
  portal, no payroll, no admission.
- **Its entire external footprint is five packages** — `@nestjs/common`,
  `@nestjs/swagger`, `@prisma/client`, `class-transformer`, `class-validator`.
- **One cross-service data read**, in one method, in one file.

So the platform slice here is **19 files**. academic-service needed 78; copying
the modules whole would have been about 230.

`src/inventory/`: `asset/`, `circulation/`, `approval/`, `reference-data/`, and a
`shared/` holding the unit-movement steps both circulation and approval call.

## The coupling is closed, and this service got its own database first

It did turn out to be the one that could go first. `findUserRoleCodes` — which
read `user_roles` and `roles` to match a caller against a workflow step's
`approverRoleCode` — is gone, along with every other read of identity-service's
tables. Session liveness and grants now come from `platform/identity`'s
`HttpIdentityAdapter` calling `POST /auth/introspect`. There is no provisioning
here and no profile join, so nothing else held it back.

> **`prisma migrate` belongs to this service.** `DATABASE_URL` points at its own
> `inventory_service` database and `prisma/` declares only the 15 models it
> owns, so `pnpm prisma:migrate` and `pnpm prisma:deploy` are safe to run here.

**`start:prod` is `node dist/src/main.js` and does not migrate.** It ran
`prisma migrate deploy` on boot until 2026-09-10, and this service was the last
of the nine still doing it. That is convenient with one container and a race
with two — both replicas start the same migration at once — and it takes the
timing of a schema change away from whoever is deploying. Migration is an
explicit deploy step now, `--profile migrate` in `docker-compose.prod.yml`,
exactly as in the other eight.

The previous version of this section described the opposite — a shared database,
`prisma/` carrying all 119 models, and a `start:prod` that deliberately did not
migrate. All three were true while eight services shared one database, and none
of them is true now.

## `reference-data/`, and the permission codes behind it

`category`, `condition`, `funding-source`, `location` and `status` are reference
lookups guarded by `inventory-reference-data.*`. Categories carry `id`, `code`,
`name`, nullable `parentId`, string-valued `depreciationRatePercent`, and
`createdAt`; category list search matches code or name case-insensitively and
orders by name ascending.
The governed record with its own lifecycle here is `Asset`, not the list of
five conditions an asset can be in.

**Renaming a permission code is only free before the database is in use.**
`SyncPermissionsUseCase` in identity-service upserts and never prunes, so on a
live database a renamed code inserts a second row while the old one keeps its
grants.

## The guard that matters most here

`src/single-role-bypass.spec.ts`. The constitution allows exactly one check on a
role *name* in the whole backend — `PermissionGuard` letting `SUPER_ADMIN`
through, as break-glass (ADR-0011). `ProcessApprovalUseCase`, in this service's
`approval/`, is where the second copy lived:

```
roleCodes.includes(approverRoleCode) || roleCodes.includes('SUPER_ADMIN')
```

It kept working after the bypass was removed from the guard, granting an approval
signature the workflow never gave it. The file is here; so is the sweep. Its
allowlist is two entries rather than the eight it started with, because the six that
named `SUPER_ADMIN` in order to *withhold* something live in
`access-control/role/`, which is identity-service's.

## The other guard worth knowing about

`inventory/shared/domain/inventory-reference-data.spec.ts` proves that every
reference row the code looks up **by name** — `systemKey: 'AVAILABLE'`,
`code: 'TX-LOAN-OUT'` — is a row some migration actually creates. The loan
lifecycle holds no ids; those strings are the entire contract between the code and
the database, and nothing else checks them.

It failed the first time this service was assembled, because `prisma/migrations`
had not been copied. That is why the history is here: the guard reads it.

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
pnpm validate     # format:check + lint + typecheck + lint:strict + test + build
```

`JWT_SECRET` must be byte-identical to identity-service's — this service verifies the
tokens that one signs, and a different secret rejects every request with a 401
that reads like an expiry.
