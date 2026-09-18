# ARCHITECTURE

The one reference for how this service is built. Two halves:

- **Part 1 — inside a module.** The Clean Architecture layering this
  service's modules are being migrated to, and the procedure for converting
  a module.
- **Part 2 — between services.** What this service owns, why it is the identity
  authority for every other one, and the schema hazard it currently carries.

They are independent: a module can be perfectly layered and still wrongly
coupled, and the reverse.

`NESTJS-RULES.md` holds the coding rules (controllers, DTOs, validation,
naming). Its two *structure* sections — `DOMAIN STRUCTURE` and
`MODULE STRUCTURE` — are superseded by Part 1 here. `IAM.md` describes the
authorization model this service implements; where it and this document
disagree about **behaviour**, `IAM.md` wins and this file is wrong.
`CLEAN-CODE.md` covers what a file looks like once it is in the right place.

---

# PART 1 — INSIDE A MODULE

## Where this service stands today

Measured 2026-09-03. Every module has converted: `user`, `audit-log`,
`session`, `access-control/role`, `access-control/permission`, `auth`,
`notification`, and — the last piece, the `.input.ts` separation rather than
a folder move — `school-unit`/`reference-data/school-unit-type`, which
arrived pre-shaped from academic-service (see CLAUDE.md's "The school-unit
exception") but still owed their five use cases taking a DTO directly:

| Signal | Count |
| --- | --- |
| Modules using the target `application/` layer | **7 of 7** |
| Use cases importing a `*.dto.js` (application → presentation) | **0 of 46** |
| Files touching Prisma outside `infrastructure/` or `core/` | 1 |
| Controllers touching Prisma | 0 |
| `.spec.ts` files | 35 |

Part 1 is done. `session` is the one exception to owning a `domain/`
folder, and deliberately: it owns no table of its own, and every use case it
has just orchestrates `AuthSessionService` (from `auth`) and
`IUserRepository` (from `user`) — a `domain/` folder here would have held
nothing but a re-exported type owned by another module, which is indirection
with no reader.

For comparison, `academic-service` — the same codebase, thirteen modules
migrated — sits at 9 of 219.

## The target layout

Every module converges on this shape. `user` converted first, and is real —
copy from it, not from this tree. `constants/` and `application/services/`
are shown because a module *may* have them (see `<module>.module.ts` /
`domain/policies/` elsewhere in this doc for where a self-contained rule
goes); `user` itself needed neither.

```
user/
├── user.module.ts
├── index.ts
├── guards/                                     NestJS wiring, not a layer — stays at the root
│   ├── provisioning-token.guard.ts
│   └── provisioning-token.guard.spec.ts
├── domain/
│   ├── entities/user.entity.ts                 UserPublic only — see "One name, two entities" above
│   └── repositories/user.repository.ts         abstract = port + DI token; every RepositoryInput lives here too
├── application/
│   └── use-cases/
│       ├── create-user/
│       │   ├── create-user.input.ts            plain interface, no decorators
│       │   ├── create-user.use-case.ts
│       │   └── create-user.use-case.spec.ts
│       ├── update-user/
│       ├── delete-user/                        no .input.ts — takes (id: string)
│       ├── get-user-by-id/                     no .input.ts — takes (id: string)
│       ├── get-users/
│       └── provision-account/                  see "multi-step write" below for why there is no separate service
├── infrastructure/
│   └── persistence/prisma/
│       ├── prisma-user.repository.ts           includes provisionAccount() — the transaction lives here, not in application/
│       ├── prisma-user.repository.spec.ts
│       └── prisma-user.includes.ts
└── presentation/http/
    ├── user.controller.ts
    ├── user.controller.spec.ts
    ├── accounts.controller.ts                  service-to-service, see its own doc comment
    ├── accounts.controller.spec.ts
    └── dto/
        ├── request/{create-user,update-user,user-query,provision-account}.dto.ts
        └── response/{user-response,provisioned-account-response}.dto.ts
```

`auth` keeps `guards/`, `strategies/` and `types/` at the module root too —
they are NestJS wiring, not one of the four layers, and moving them buys
nothing.

## The dependency rule

```
presentation ──> application ──> domain
infrastructure ─────────────────> domain
```

- `domain/` imports nothing from the other three layers.
- `application/` may import `domain/`. **Never Prisma, never a DTO.**
- `infrastructure/` implements a `domain/` port. The only place touching Prisma.
- `presentation/` may import `application/`. Never a repository, never Prisma.

The rule this service breaks most often is the second one. `user` had this in
five of its use cases; `create-user.use-case.ts` was one, and its fix —
`.input.ts` plus the use case taking `CreateUserInput` — is the template.
Eight use cases across the other five modules still have it, for example:

```ts
// access-control/role/use-cases/create-role.use-case.ts — unconverted
import { CreateRoleDto } from '../dto/request/create-role.dto.js'

async execute(dto: CreateRoleDto) { ... }
```

`CreateUserDto` carries `class-validator` decorators and `@ApiProperty`. A use
case depending on it cannot be tested or reused without dragging the HTTP
contract along, and the arrow points from the inner layer to the outer one. The
fix is one small file per use case — see "Three type boundaries" below.

## Which entity style — the deciding question

> **Can the aggregate enforce a rule entirely on its own, with no database
> lookup?** If yes, a class. If no, an interface.

`UserEntity` says **no**, and the code already agrees: identifier uniqueness
needs `existsByIdentifier()`, and the password rule lives in
`PasswordManagerService`. So `UserEntity` stays a shape, and the rules stay
where they can reach the database.

Self-contained checks go in `domain/policies/`, never in the entity file — an
entity file describes shape, a policy file states a rule. `access-control/role`
already has one in spirit (`structural-roles.constants.ts` plus the guard in
`depended-on-roles.spec.ts`); it becomes `domain/policies/` on conversion.

**Default to interface.** Reach for a class only when you can name the
self-contained rule.

### One name, two entities — resolved on conversion

`user/domain/entities/user.entity.ts` declared `class UserEntity`, and
`user/domain/interfaces/user-repository.interface.ts` imported a *different*
`UserEntity` from `shared/domain/entities/user.entity.js`, then re-exported
`UserPublic` from the first. Two types, one name, in adjacent files.

The local class turned out to be dead: nothing in the codebase constructed or
typed against it, and every real usage — `findByIdWithPassword`,
`findByIdentifierWithPassword`, and `auth`'s own repository port — already
went through the shared interface. So the resolution here was not "the
module's own entity wins" in the sense of keeping the local shape; it was
deleting code that had no reader. `user/domain/entities/user.entity.ts` now
declares only `UserPublic` (real, module-specific), and `UserEntity` keeps
coming from `shared/`, unchanged, because `auth` still depends on it and
`auth` has not converted yet. That shared file is not touched by this
module's conversion — a decision to make when `auth` converts, not before.

`UserPublic` had the same shape of bug one level down: `prisma-user.includes
.ts` declared its *own* `UserPublic`, derived from `Prisma.UserGetPayload`,
that included `userRoles`/`profile` and omitted `lastLoginAt` — a shape that
never matched the domain-declared one and was never checked against it,
because nothing imported it. `PUBLIC_USER_SELECT` selected `userRoles` and
`profile` for every list/get call and nothing downstream ever read either
field. Both are gone now: the select matches the domain `UserPublic` exactly
(added `lastLoginAt`, the field it always claimed to return; dropped the two
that were pure over-fetch), and the derived type is deleted along with it.

## Three type boundaries

| Type | Lives in | Carries |
| --- | --- | --- |
| `XxxDto` | `presentation/http/dto/` | `class-validator` + `@ApiProperty` |
| `XxxInput` | `application/use-cases/<name>/` | nothing — a plain interface |
| `XxxRepositoryInput` | `domain/repositories/` | nothing — a plain interface |

They may be structurally identical. TypeScript is structural, so a controller
passes a Dto straight into a use case expecting an Input. **Do not write a
mapper for it.** What you must not do is let the use case *name* the Dto.

Create `.input.ts` only when the use case takes structured input. One taking
`(id: string)` or nothing needs no Input file.

The repository port is the third boundary, and `user`'s skipped it before
conversion:

```ts
// domain/interfaces/user-repository.interface.ts — before, in this repo
abstract update(
  id: string,
  data: Partial<Pick<UserEntity, 'identifier' | 'passwordHash' | 'isActive'>>,
): Promise<UserPublic>
```

`Partial<Pick<Entity>>` ties the port's input to the entity's shape, so adding a
field to the entity silently widens what callers may write. `user.repository
.ts` now declares `UpdateUserRepositoryInput` in the same file as the port,
naming the three fields explicitly — the fix, not just the diagnosis. No
other module has this specific pattern today, but the same fix applies
wherever one turns up.

## Import depth

NodeNext ESM: **every relative import ends in `.js`** though the source is
`.ts`. A wrong `../` count is the most common conversion error, and
`pnpm run typecheck` catches every one.

| File location | → `src/` | → module root |
| --- | --- | --- |
| `<module>.module.ts`, `index.ts` | `../` | `./` |
| `domain/{entities,repositories,policies}/x.ts` | `../../../` | `../../` |
| `application/use-cases/<name>/x.ts` | `../../../../` | `../../../` |
| `application/services/x.ts` | `../../../` | `../../` |
| `infrastructure/persistence/prisma/x.ts` | `../../../../` | `../../../` |
| `presentation/http/x.controller.ts` | `../../../` | `../../` |
| `presentation/http/dto/request/x.dto.ts` | `../../../../../` | `../../../../` |

Depths assume a module directly under `src/`. `access-control/permission`
and `access-control/role` sit one level deeper — add one `../` to every entry.

This table was off by one `../` in every "→ `src/`" row from when it was
first written — the "→ module root" column was always right, which is how
the error passed a `pnpm run typecheck` on the modules it was never actually
tested against. Caught and corrected during the `user` conversion by
checking against academic-service's already-verified equivalents rather
than trusting the arithmetic. Verify a doc's claimed depth against a real,
typechecked file before treating it as ground truth — a table like this one
is exactly the kind of thing that looks authoritative and is wrong.

## Converting a module — the procedure

One module per commit. Old layout → new:

| Old | New |
| --- | --- |
| `domain/interfaces/<name>-repository.interface.ts` | `domain/repositories/<name>.repository.ts` |
| `use-cases/<name>.use-case.ts` | `application/use-cases/<name>/<name>.use-case.ts` |
| `services/<name>.service.ts` | `application/services/<name>.service.ts` |
| `infrastructure/persistence/*.ts` | `infrastructure/persistence/prisma/*.ts` |
| `presentation/<name>.controller.ts` | `presentation/http/<name>.controller.ts` |
| `dto/request/*.ts`, `dto/response/*.ts` | `presentation/http/dto/request/*.ts`, `.../response/*.ts` |

`constants/` stays at the module root. `domain/entities/` does not move.
`auth/guards/`, `auth/strategies/`, `auth/types/` do not move.

**1. Find every external consumer first.** This is your fix-up list for step 6;
empty means the module is self-contained.

```bash
grep -rln "<module>/domain/interfaces\|<module>/use-cases\|<module>/dto/\|<module>/presentation/\|<module>/infrastructure/persistence" src
```

**2. Move the port.** Same depth, so its own imports do not change.

```bash
mkdir -p src/<module>/domain/repositories
git mv src/<module>/domain/interfaces/<name>-repository.interface.ts \
       src/<module>/domain/repositories/<name>.repository.ts
rmdir src/<module>/domain/interfaces
```

**3. Move each use case into its own folder.** Add `.input.ts` where it used to
take a `*Dto`, and change the signature to the `Input`. Move its `.spec.ts`
alongside. Fix depths. Never add a spec to a use case that never had one, never
delete one that did.

**4. Move infrastructure** into `infrastructure/persistence/prisma/`.

**5. Move presentation** into `presentation/http/`, DTOs under `dto/request/`
and `dto/response/`.

**6. Fix the consumers from step 1**, then re-run the grep to confirm nothing is
left.

**7. Rewrite `<module>.module.ts` and `index.ts`.** Keep any `forwardRef()`
exactly as it was — it is there for a circular dependency.

**8. Verify in order, stopping at the first failure.**

```bash
pnpm run typecheck                      # catches every wrong ../
pnpm run lint && pnpm run lint:strict
pnpm exec jest --testPathPatterns=<module>
npx prettier --write "src/<module>/**/*.ts"
pnpm run validate                       # the whole pipeline, including build
```

**9. Commit, scoped to the module.**

```bash
git add -A -- src/<module>/
git diff --cached --stat                # READ THIS before committing
git commit -m "refactor(<module>): migrate to Clean Architecture layering"
```

**Suggested order:** ~~`user` (smallest with real specs)~~ →
~~`school-unit`/`reference-data/school-unit-type`~~ → ~~`audit-log`~~ →
~~`session`~~ → ~~`access-control/role`~~ → ~~`access-control/permission`~~
→ ~~`auth`~~ → ~~`notification`~~.

Part 1 is done: every module has converted, and the `.input.ts` separation
that `school-unit`/`reference-data/school-unit-type` still owed on arrival
from academic-service is closed too.

Done so far: `user` (2026-09-03), `audit-log` (2026-09-03 — both use cases
took inline/Dto parameters and now have their own `.input.ts`;
`PrismaAuditLogRepository` also switched from `implements` to `extends
IAuditLogRepository`, matching every other repository in this service),
`session` (2026-09-03 — no `domain/` folder added after all: it owns no
table, and every use case only orchestrates `auth`'s `AuthSessionService` and
`user`'s `IUserRepository`, so there was no repository, no structured input,
and no self-contained rule to house there; the folder move plus a stray file
naming fix — `revoke-all-session.use-case.ts`, singular, for a class named
`RevokeAllSessionsUseCase` — was the whole job), `access-control/role`
(2026-09-03 — `domain/interfaces/role-repository.interface.ts` ->
`domain/repositories/role.repository.ts`; `constants/structural-roles
.constants.ts` plus `domain/depended-on-roles.spec.ts` became
`domain/policies/structural-roles.policy.ts` and its spec, the policy this
service already had in spirit; `create-role` and `update-role` gained
`.input.ts` files; `PrismaRoleRepository.create`, `.update` and
`.createStructural` were each taking their own inline anonymous parameter
type instead of the named `*RepositoryInput` types the port already
declared — `createStructural`'s had no named type at all, so
`CreateStructuralRoleRepositoryInput` was added next to the port; a dead
file, `infrastructure/persistence/prisma-role.includes.ts`, was deleted —
its `UserRoleWithRole` derived type was never imported anywhere, the same
shape of bug `user`'s own conversion found and fixed. `access-control/domain
/entities/{role,permission}.entity.ts` did not move: they are genuinely
shared between `role` and `permission`, and "`domain/entities/` does not
move" is the rule for exactly this reason), `access-control/permission`
(2026-09-03 — `domain/interfaces/permission-repository.interface.ts` ->
`domain/repositories/permission.repository.ts`; `create-permission` and
`update-permission` gained `.input.ts` files; `PrismaPermissionRepository
.upsertPermission`, `.createPermission` and `.updatePermission` each
repeated their own inline anonymous parameter type instead of a named
`*RepositoryInput` — `upsertPermission` and `createPermission` share the
identical shape, so `UpsertPermissionRepositoryInput` is a type alias of
`CreatePermissionRepositoryInput` rather than a second copy of the same four
fields. `constants/permission-apps.constants.ts` plus its spec became
`domain/policies/permission-apps.policy.ts`: `appForModule` is a
self-contained classification with its own consistency-checking spec, the
same shape as `structural-roles.policy.ts`. `constants/permission-codes
.constants.ts` (the 1759-line catalogue) stayed in `constants/` — pure data,
no rule of its own, CLEAN-CODE.md's own exception to the file-size rule.
`decorators/`, `guards/`, and `types/` all stayed at the module root too:
none of the three is a Clean Architecture layer, the same reason `user`'s
`guards/provisioning-token.guard.ts` never moved), `auth` (2026-09-03 —
the largest module, 44 files, nine use cases, four services. `domain
/interfaces/auth-repository.interface.ts` -> `domain/repositories/
auth.repository.ts`; `services/` -> `application/services/` (all four:
`auth-session`, `auth-cleanup`, `password-manager`, `token-manager` — each
orchestrates the repository or an external SDK across more than one use
case, matching this doc's own `application/services/` slot).
`guards/jwt-auth.guard.ts`, `strategies/jwt.strategy.ts`, and
`types/jwt-token-payload.type.ts` all stayed at the module root, same
reasoning as `access-control/permission`'s `guards/`/`decorators/`/`types/`
— none is a layer. `types/auth-session.types.ts` did **not** stay, though:
its two exports, `CreateSessionData` and `UpdateSessionTokenData`, were
`IAuthRepository`'s own create/update inputs in every way but name and
location — moved into `domain/repositories/auth.repository.ts` as
`CreateSessionRepositoryInput`/`UpdateSessionTokenRepositoryInput`, next to
the port, and the now-empty `types/auth-session.types.ts` deleted. `login`,
`change-password`, and `reset-password` gained `.input.ts` files (all three
imported a Dto directly before); `login`'s use case still also takes
`userAgent?`/`ipAddress?` as trailing primitive parameters, unchanged,
since those come from the request rather than the submitted credentials
and folding them into `LoginInput` would misdescribe what the caller
submitted. `request-password-reset.use-case.ts`'s return shape was declared
inline twice (once on the signature, once on a local `const`) — named
`RequestPasswordResetResult` and used in both places. One dead file
deleted, matching the shape of bug found twice already in this service:
`dto/request/refresh-token.dto.ts` was never imported anywhere — the
`/auth/refresh` route reads the refresh token from an HttpOnly cookie, not
a request body, and the Dto was declared for a route that never used it.

**Found, not fixed:** two independent password-hashing implementations
exist in this service. `shared/utils/hash.helper.ts`'s `hashPassword()`
reads `BCRYPT_SALT_ROUNDS` from the environment (default 10) and is used by
`user`'s `create-user` use case. `auth/application/services/password-manager
.service.ts`'s `hashPassword()` hardcodes 10 and is used by every auth use
case that sets a password (`login`'s verification path, `change-password`,
`reset-password`). Bcrypt embeds its round count in the hash string, so
verification is unaffected by which one wrote a given row — this is not a
correctness bug, and both call sites keep working today whichever config
value `BCRYPT_SALT_ROUNDS` holds. It is a real duplication of a
security-relevant decision with no single owner, and merging the two
authorities is a deliberate choice about salt-round policy, not a
mechanical rename — left as a flagged finding rather than folded into this
structural conversion), `notification` (2026-09-03 — the smallest module: one
service, no domain, no use cases, no controller. `email.service.ts` ->
`application/services/email.service.ts`, the same placement rule as `auth`'s
four services, applied even though this module has nothing else — the rule is
about the layer a file belongs to, not about whether it has sibling use
cases. `request-password-reset.use-case.ts` in `auth` imported `EmailService`
by reaching past `notification`'s barrel straight into its internal path —
the only cross-module import in the service that did this instead of going
through `index.ts` — fixed to import from `notification/index.js` like every
other cross-module dependency, and `EmailService` added to that barrel's
exports since it was not there to import from before), and finally the
`.input.ts` separation on `school-unit`/`reference-data/school-unit-type`
(2026-09-03 — arrived pre-shaped from academic-service, folders already
right, but two of `reference-data/school-unit-type`'s five use cases and
three of `school-unit`'s five still took a DTO directly or an inline
anonymous type; the other five (`get-*`, `delete-*`) took only a bare `id`
and needed nothing.

`reference-data/school-unit-type`: `create-school-unit-type` imported the
Dto directly; `update-school-unit-type` didn't import a Dto at all but
declared its own inline `{ code?: string; name?: string }` parameter type —
the same "NO INLINE TYPES" violation, caught by reading the file rather than
by the `*.dto.js` grep that found the others. `PrismaSchoolUnitTypeRepository`
also switched from `implements` to `extends ISchoolUnitTypeRepository` (the
same drift `audit-log` had), and its own `create`/`update` gained the named
`*RepositoryInput` types the port already declared instead of repeating them
inline.

`school-unit`: `setup-school-unit` and `school-unit-social-media`'s
`create`/`update` already mapped every field by hand into the repository
call — only their Dto imports needed replacing with `.input.ts` files.
`update-school-unit` and `school-unit-address`'s `setAddress`/`updateAddress`
did not: both passed the Dto straight through into the repository call,
which happened to compile because the shapes matched field-for-field, but is
exactly what "map every field, by hand" forbids — both now build an explicit
object literal. `school-unit-address` uses `shared/dto/address.dto.ts`, a
cross-module Dto rather than one owned by this module, but the naming rule
does not carve out an exception for that: the use case still may not import
and name a Dto as its own parameter type, so `SetAddressInput`/
`UpdateAddressInput` were added even though their shape is a near-duplicate
of the shared Dto's.

**Found, not fixed, twice more:** `CreateSchoolUnitTypeDto.isActive` and
`CreateSchoolUnitSocialMediaDto.url` are both validated on the way in and
then silently dropped — neither repository port has a field to receive
them. Same shape of bug as the password-hashing duplication in `auth`:
real, but fixing either means either removing accepted API surface or
wiring a new field through to the database, both judgment calls beyond a
structural `.input.ts` separation.

## What this layering deliberately does not do

Stated once, here, so it isn't relitigated module by module:

- **No domain events.** A module needing another module's result makes a direct,
  awaited call into that module's exported use case. `@nestjs/event-emitter` is
  not a dependency.
- **No value objects for primitives.** An identifier, a role code, a token TTL is
  validated by a policy function at the boundary (`domain/policies/`), not
  wrapped in a class.
- **A repository port's input/output types are declared next to the port**, in
  the same file as the abstract class — never `Partial<Pick<Entity>>`, never a
  bare entity passed into `create()`/`update()`.
- **A mapper file is the exception, not the default.** Reach for
  `infrastructure/mappers/` only when a row's outward shape genuinely differs
  from what Prisma returns.
- **A multi-step write that must be one transaction is one repository method,
  not a separate service the use case orchestrates.** `user`'s `provision()`
  used to be its own `AccountProvisioningService`, injected into
  `ProvisionAccountUseCase` alongside `PrismaService` so the use case could
  open the transaction itself — meaning `application/` touched Prisma twice
  over. It is now `IUserRepository.provisionAccount()`: the transaction, the
  role lookup, and the nested profile create are entirely inside
  `PrismaUserRepository`, and the use case is symmetric with every other one
  in the module — it depends on the port and nothing else. Reach for this
  shape whenever a use case would otherwise need to inject `PrismaService`
  directly.
- **An enum shared between a repository port and its Prisma implementation
  uses the domain copy (`shared/domain/enums/`), not `@prisma/client`'s
  generated one**, even though Prisma's generated enums are plain string
  literal unions and would work. A domain file importing `@prisma/client` is
  the same class of violation as importing `PrismaService` — measured by
  "Files touching Prisma outside `infrastructure/` or `core/`" above — and
  the shared enum's value converts into Prisma's union with no cast, so there
  is no cost to keeping domain clean here.

`auth` has ten use cases and will pass the threshold where
`application/use-cases/` wants splitting into `commands/` and `queries/`. Split
it at conversion time, not later.

---

# PART 2 — THE SERVICE BOUNDARY

## What this service is

The identity authority for the whole platform. It owns sign-in, sessions,
password lifecycle, users, roles, permissions, and the audit log — plus, since
2026-09-03, the school's own institution record (`school-unit`), moved from
academic-service because it is config every service eventually reads and
every service already talks to this one anyway. Every other service trusts a
token this one issued, and `inventory-service` asks it, over HTTP, who a
caller is.

Every module under `src/` is owned outright. There is no `platform/` directory
here, and there should never be one: this *is* the platform.

## What it answers for others

| Endpoint | Caller | Contract |
| --- | --- | --- |
| `POST /auth/introspect` | `inventory-service` (`HttpIdentityAdapter`) | token → `{ userId, identifier, sessionId, roles, permissions }`, or `null` for a token that is bad, expired, revoked, or deactivated |

That response shape is a **published contract**, not an internal type. Changing
a field name is a breaking change for a repo that does not build in this one's
CI. Two rules follow:

- `IntrospectionResponseDto` is append-only. Removing or renaming a field needs
  a coordinated release with every consumer.
- The consumer's own copy of the shape lives in
  `inventory-service/src/platform/identity/identity.port.ts`. When this contract
  changes, that file changes in the same PR pair.

`academic-service`, `admission-service`, `portal-service` and `presence-service`
do **not** call this endpoint. They verify the JWT locally and read
`auth_sessions` and `users` from the shared database directly. Closing that is
their migration, not this service's — but it is why the endpoint must stay
stable and cheap.

## Its own database, and who may migrate it

`prisma/` declares **20 models** across seven `.prisma` files (`auth`, `iam`,
`profile`, `file`, `school-unit`, `region`, and the reference lists), and
`DATABASE_URL` names `identity_service`, which nothing else writes. The schema
describes that database completely, which is the condition Principle VII asks
for.

So `pnpm prisma:migrate` and `pnpm prisma:deploy` are both safe here, and
`prisma/migrations/` exists.

> **`start:prod` is `node dist/src/main.js` and does not migrate. Do not "fix"
> this.** Migrating on boot hands the timing of a schema change to whichever
> replica starts first, and races every extra one. Migration is an explicit
> deploy step: `--profile migrate` in `docker-compose.prod.yml`.

`pnpm prisma:generate` is required before anything else and is always safe.

### What this section used to say, and why it changed

Until 2026-09-09 this repo declared 16 of the 119 models in a database shared
with `academic-service`, `admission-service`, `portal-service` and
`presence-service`, and running either script would have dropped the 103 it did
not declare. Three things kept that from happening — no `migrations/` directory,
a `start:prod` that did not migrate, and nobody typing the command — and none of
them was a guard rail.

The three preconditions that section listed have all been met:

1. **Every service reads `auth_sessions` and `users` over HTTP.** All eight
   non-identity services call `POST /auth/introspect` through a byte-identical
   `src/platform/identity/` slice.
2. **`profiles` is no longer joined across services.** Six services batch
   `POST /profiles/batch` instead.
3. **Account provisioning is an HTTP call.** `POST /accounts` and the rest of
   `/accounts/*`, called by admission, hr and student.

The database separated on that basis, and `prisma migrate` belongs to this
service now.

## Authorization rule, binding

**Permissions, never role names** — `@RequirePermissions('users.create')`,
module segment plural. `SUPER_ADMIN` is checked in exactly one place, the
`PermissionGuard`. If you find a second place that checks a role name, that is a
bug, not a shortcut; see `permission.guard.spec.ts`.

---

# PITFALLS

**Never `git add -A` or `git add .` without a path.** Scope to the module, and
read `git diff --cached --stat` before committing. To tell a real change from
line-ending noise: `git diff --ignore-cr-at-eol -- <path>` — empty means no real
change.

**Zero comments in business code.** Do not add explanatory comments, and when
relocating a file, strip the comments it already carries in the same pass.
Swagger `@ApiProperty({ description })` is API documentation and stays. The one
sanctioned exception is a comment stating a **trade-off at a service boundary**
— see `CLEAN-CODE.md`, "comment rules", for where that line sits.

**`permission-codes.constants.ts` is 1759 lines and that is correct.** It is a
catalogue, not logic. The file-size rule does not apply to it. Do not "split it
up" — the sync bootstrap reads it as one list.

**Dead code found on the way** — a method on a Prisma repository not declared on
the port and called nowhere — gets deleted, and the commit message says so. Grep
the whole tree first; a method reachable through a differently-named port method
is not dead.
