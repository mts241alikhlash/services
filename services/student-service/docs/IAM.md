# IAM (Identity & Access Management) Architecture

## Purpose

This document defines how authentication and authorization work across the
241 platform, and which service owns which piece. It is shared reading for
every service that authenticates a request — it does not describe a module
that lives entirely in one repo.

**Corrections from the previous version of this doc**: it described a
multi-tenant model (`organizationId` on `User` and `Role`) that was never
built. The actual deployment is single-school — see
`NESTJS-RULES.md`'s SCOPING RULES. It also listed the full auth/users/roles
CRUD surface without saying which service answers which endpoint; that split
is now explicit below, and it was reconciled against the running code, not
against the earlier design.

---

# Who owns what

| Piece | Owner | What every other service has |
|---|---|---|
| `POST /auth/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password` | identity-service | Nothing — no controller |
| Token verification (`GET` on every authenticated route) | Both | `JwtStrategy` + `ValidateTokenUseCase` here verify the signature and check the session is live |
| `GET/POST/PATCH/DELETE /users` | identity-service | Nothing — this repo has neither `teacher` nor `student` since the 2026-09-03 extraction; `hr-service`/`student-service` provision the account by calling identity-service's `POST /accounts` over HTTP, not by writing the table |
| Role & permission CRUD, the permission-catalogue sync | identity-service | `PermissionGuard` only — reads, never writes |
| `auth_sessions`, `users`, `user_roles`, `roles`, `role_permissions`, `permissions` tables | identity-service's database | Nothing. Every service has its own database as of 2026-09-09, and no service reads identity's tables through Prisma any more — every answer arrives over HTTP through `src/platform/identity/` |

If you are in identity-service reading this, the left column is yours in full.
If you are anywhere else, the right column is all you get, and you get it over
HTTP: `POST /auth/introspect`, cached, coalesced, timed out, and failing closed
with 503 rather than 401. That slice is byte-identical in all eight non-identity
services — change it in one and it must change in all eight.

---

# Design Principles

## Authentication != Authorization

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
What are you allowed to do?
```

Never mix both concerns.

---

# Authentication

Owned by identity-service end to end: login, refresh, logout, forgot-password,
reset-password, change-password, `GET /auth/me`. A consuming service only
ever verifies — see `JwtStrategy` → `ValidateTokenUseCase` in `platform/auth/`
for the reference implementation of that half.

`ValidateTokenUseCase` reads `auth_sessions` and `users` on **every**
authenticated request, deliberately not from the token: a revoked session
must stop working immediately, and a token claim can't be revoked before it
expires.

## User

An account, not a person. A Student, a Teacher and a Parent are all separate
domain records that reference one `User` by id — a User is never assumed to
be any one of them.

```typescript
User {
  id
  identifier      // login handle — not split into username/email
  passwordHash
  isActive
  lastLoginAt
  createdAt
  updatedAt
  deletedAt       // soft delete
}
```

No `organizationId`. This deployment is single-school; see
`NESTJS-RULES.md`'s SCOPING RULES for what a query scopes by instead
(soft-delete + active period, never a tenant column the schema doesn't have).

## Session

```typescript
AuthSession {
  id
  userId
  tokenHash
  userAgent
  ipAddress
  expiresAt
  lastUsedAt
  revokedAt
  createdAt
  updatedAt
}
```

## Profile

Personal information, never merged into `User`.

```typescript
Profile {
  id
  userId
  name
  gender
  birthPlace
  birthDate
  phone
  // ... — see prisma/profile.prisma for the full, current field list
}
```

A profile is read narrowly: `PROFILE_NAME_SELECT`, `PROFILE_DISPLAY_SELECT`
or `PROFILE_ROSTER_SELECT` from `shared/domain/prisma-selects.ts`, per the
"Read only the fields the caller shows" rule in `NESTJS-RULES.md`. Reaching
it *through* `User` needs the matching `USER_*_SELECT` — `User` owns
`passwordHash`, and a bare `include` pulls every scalar column on the way to
the relation.

---

# Authorization

## Roles and Permissions

```typescript
Role {
  id
  name
  code
  description
  isSystem
  createdAt
  updatedAt
}

Permission {
  id
  module
  action
  code            // "<module>.<action>", module segment PLURAL
  description
}
```

No `organizationId` on `Role` either — every role is a platform-wide role in
this single-school deployment.

```text
users.read / users.create / users.update / users.delete
students.read / students.create / students.update / students.delete
report-cards.read / report-cards.publish
attendance.read / attendance.manage
```

The full list lives in
`platform/access-control/permission/constants/permission-codes.constants.ts`.

`UserRole` and `RolePermission` are the many-to-many join tables between
them; nothing about their shape has changed.

## How a request is actually authorized (current mechanism, since 2026-08-30)

The access token carries `roles` and, when the list is small enough,
`permissions` as claims. `PermissionGuard` reads `request.user` first:

```text
JwtStrategy verifies signature + expiry
  → ValidateTokenUseCase confirms the session is live, the account active
    → request.user = { id, roles?, permissions? }  (roles/permissions from
      the token when present)
      → PermissionGuard: user.roles ?? read user_roles from the database
        → user.permissions ?? read role_permissions/permissions from the DB
```

The database fallback exists because a token can arrive without them: one
minted before 2026-08-30, or a caller whose grant list exceeded the header
budget (SUPER_ADMIN — 262 grants, ~8.1KB, over Nginx's 8k default buffer).
Measured over ten authenticated requests, the token path costs **zero**
queries into `user_roles`/`role_permissions`/`permissions`; the fallback path
costs the same three reads every request always paid before. Both paths
still read `auth_sessions` + `users` on every request — that part did not
move to the token and, per the note above, should not.

## The one bypass, and where it lives

`SUPER_ADMIN` is the only role that skips the permission check, and the
check for it lives in exactly one place: `PermissionGuard`, checked before
any permission is resolved. ADR-0011 forbids copying that check anywhere
else — `single-role-bypass.spec.ts` sweeps the codebase for a second one.

`ADMIN` used to bypass too, with a growing exemption list carved out
per-area (ADR-0006, ADR-0008: `portal-`, `payroll-` prefixes). That shape
failed silently — a new area needing separation had to be *remembered* into
the list, and forgetting it meant ADMIN passed anyway, before any grant was
even read. `ADMIN` is now an ordinary role: whatever its grants say, and
nothing more. If you are about to add a role-name check outside
`PermissionGuard`, this history is why the answer is no — see
`platform/access-control/permission/guards/permission.guard.ts` for the
current, complete implementation and its comments.

---

# Guards

Authorization must use permissions, checked in exactly one place.

Good:

```typescript
@RequirePermissions('students.create')
```

Bad:

```typescript
if (user.role === 'Admin')
```

Never hardcode role names in business logic outside `PermissionGuard`
itself.

---

# Permission Naming Convention

Format:

```text
<module>.<action>
```

Module segment is **plural**:

```text
users.read
students.read / students.create
report-cards.publish
attendance.manage
```

Avoid:

```text
canCreateStudent
createStudentPermission
student_create
```

---

# Audit Log Integration

STATUS: infrastructure only, not yet wired into `academic/` — see
`NESTJS-RULES.md`'s AUDIT RULES for the exact target list and what exists
today (`AuditLog` model, `platform/audit-log/`, zero callers from academic).
Do not describe auditing here as enforced; it isn't yet.

---

# Golden Rules

1. User is an account, not a person — a Student/Teacher/Parent references
   one by id.
2. Profile stores personal information, read narrowly, never merged into
   User.
3. Authentication and Authorization are separate concerns.
4. Roles represent job functions; Permissions represent actions.
5. Business modules check permissions, never role names, and only through
   `PermissionGuard`.
6. There is one bypass (`SUPER_ADMIN`), checked in one place. Do not add a
   second one.
7. This deployment is single-school: no `organizationId`, anywhere. Scope
   queries by soft-delete and active period instead.
8. identity-service owns login, refresh, logout, password reset, and all role and
   permission CRUD. A consuming service verifies; it does not re-implement.
9. A revoked session stops working on the next request. A revoked
   permission takes up to the access-token lifetime (15 minutes) — that gap
   is deliberate, not a bug; see `CLAUDE.md`.
