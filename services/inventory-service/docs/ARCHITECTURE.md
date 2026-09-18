# ARCHITECTURE

The one reference for how this service is built. Two halves:

- **Part 1 — inside a module.** The Clean Architecture layering used by
  `src/inventory/`, and the procedure for converting a module.
- **Part 2 — between services.** How this service owns its database, how it asks
  `identity-service` who a caller is, and what that costs.

They are independent: a module can be perfectly layered and still wrongly
coupled, and the reverse.

`NESTJS-RULES.md` holds the coding rules (controllers, DTOs, validation,
naming). Its two _structure_ sections — `DOMAIN STRUCTURE` and
`MODULE STRUCTURE` — are superseded by Part 1 here. `IAM.md` describes the
authorization model; note that this service **implements none of it locally**
— see Part 2. `CLEAN-CODE.md` covers what a file looks like once it is in the
right place.

---

# PART 1 — INSIDE A MODULE

## Baseline: 2026-09-02

Baseline measured 2026-09-02 against `src/inventory/`, before the
`reference-data/category` rehearsal:

| Signal                                                        | Count        |
| ------------------------------------------------------------- | ------------ |
| Modules using the target `application/` layer                 | **0 of 8**   |
| Use cases importing a `*.dto.js` (application → presentation) | **22 of 40** |
| Files touching Prisma outside `infrastructure/` or `core/`    | 1            |
| Controllers touching Prisma                                   | 0            |
| `.spec.ts` files                                              | 12           |

This was the pre-rehearsal baseline. More than half of its use cases named a
presentation-layer DTO, and `circulation` had no use-case specs.

The boundary work had gone into `platform/`, while `src/inventory/` remained
flat. This section stays as historical evidence; it is not the current status.

## Current measured state: 2026-09-16

| Signal                                                              | Count        |
| ------------------------------------------------------------------- | ------------ |
| Modules using the target `application/` layer                       | **8 of 8**   |
| Production use cases importing a request DTO                        | **0**        |
| Production files touching Prisma outside infrastructure persistence | **0**        |
| Controllers touching Prisma                                         | **0**        |
| Jest suites / tests                                                 | **71 / 407** |

All eight inventory business modules now use the target layered structure.
Reference-data metadata remains a composition use case over the five lookup
modules. Asset, circulation, and approval repositories use public capability
ports for foreign data, and each of the 15 Prisma models has one owner. The
approval consequence flow uses an approval-local transaction followed by
awaited, retryable downstream calls.

## The target layout

Every module converges on this shape. `reference-data/category` is the module to
convert first: four use cases, one repository, one controller, no cross-module
callers — a complete rehearsal in under an hour.

```
asset/
├── asset.module.ts
├── index.ts
├── constants/                                  stays at the module root
├── domain/
│   ├── entities/{asset,asset-unit}.entity.ts
│   ├── policies/                               self-contained rules go here
│   └── repositories/
│       ├── asset.repository.ts                 abstract = port + DI token
│       └── asset-unit.repository.ts
├── application/
│   ├── use-cases/
│   │   ├── create-asset/
│   │   │   ├── create-asset.input.ts           plain interface, no decorators
│   │   │   └── create-asset.use-case.ts
│   │   ├── add-units/
│   │   ├── update-asset/
│   │   ├── get-assets/
│   │   └── ...
│   └── services/                               stateless logic shared by 2+ use cases
├── infrastructure/
│   └── persistence/prisma/
│       ├── prisma-asset.repository.ts
│       ├── prisma-asset.includes.ts
│       ├── prisma-asset-unit.repository.ts
│       └── prisma-asset-unit.lendable.spec.ts
└── presentation/http/
    ├── asset.controller.ts
    ├── asset-unit.controller.ts
    └── dto/
        ├── request/{create-asset,update-asset,asset-query,create-units,update-unit,asset-unit-query}.dto.ts
        └── response/
```

`reference-data` keeps its five sub-modules (`category`, `condition`,
`funding-source`, `location`, `status`) as separate module folders under it.
Each converts independently; they are structurally identical, so convert one
carefully and the other four are mechanical.

## The dependency rule

```
presentation ──> application ──> domain
infrastructure ─────────────────> domain
```

- `domain/` imports nothing from the other three layers.
- `application/` may import `domain/`. **Never Prisma, never a DTO.**
- `infrastructure/` implements a `domain/` port. The only place touching Prisma.
- `presentation/` may import `application/`. Never a repository, never Prisma.

At the 2026-09-02 baseline, twenty-two of this service's forty use cases broke
the second rule by importing a DTO. The migration replaced those dependencies
with plain application inputs. See "Three type boundaries" for the rule.

## Which entity style — the deciding question

> **Can the aggregate enforce a rule entirely on its own, with no database
> lookup?** If yes, a class. If no, an interface.

**`AssetUnit` is the one that says yes.** Whether a unit may be lent is decided
by the unit's own status and its current circulation state — no lookup beyond
what the unit already carries. `prisma-asset-unit.lendable.spec.ts` exists
because that rule was worth pinning down. On conversion, that rule moves out of
the repository and onto the entity, and the spec follows it.

**`Asset` says no.** Its code must be unique and its category must exist —
both need the database. It stays an interface, and those checks stay in the use
case where they can reach a repository.

Self-contained checks go in `domain/policies/`, never in the entity file — an
entity file describes shape, a policy file states a rule.

**Default to interface.** Reach for a class only when you can name the
self-contained rule.

## Three type boundaries

| Type                 | Lives in                        | Carries                            |
| -------------------- | ------------------------------- | ---------------------------------- |
| `XxxDto`             | `presentation/http/dto/`        | `class-validator` + `@ApiProperty` |
| `XxxInput`           | `application/use-cases/<name>/` | nothing — a plain interface        |
| `XxxRepositoryInput` | `domain/repositories/`          | nothing — a plain interface        |

They may be structurally identical. TypeScript is structural, so a controller
passes a Dto straight into a use case expecting an Input. **Do not write a
mapper for it.** What you must not do is let the use case _name_ the Dto.

Create `.input.ts` only when the use case takes structured input. One taking
`(id: string)` or nothing needs no Input file.

## Import depth

NodeNext ESM: **every relative import ends in `.js`** though the source is
`.ts`. A wrong `../` count is the most common conversion error, and
`pnpm run typecheck` catches every one.

| File location                                  | → `src/`             | → module root  |
| ---------------------------------------------- | -------------------- | -------------- |
| `<module>.module.ts`, `index.ts`               | `../../`             | `./`           |
| `domain/{entities,repositories,policies}/x.ts` | `../../../../`       | `../../`       |
| `application/use-cases/<name>/x.ts`            | `../../../../../`    | `../../../`    |
| `application/services/x.ts`                    | `../../../../`       | `../../`       |
| `infrastructure/persistence/prisma/x.ts`       | `../../../../../`    | `../../../`    |
| `presentation/http/x.controller.ts`            | `../../../../`       | `../../`       |
| `presentation/http/dto/request/x.dto.ts`       | `../../../../../../` | `../../../../` |

Depths assume a module directly under `src/inventory/`. The five `reference-data`
sub-modules sit one level deeper — add one `../` to every entry.

## Converting a module — the procedure

One module per commit. Old layout → new:

| Old                                                | New                                                       |
| -------------------------------------------------- | --------------------------------------------------------- |
| `domain/interfaces/<name>-repository.interface.ts` | `domain/repositories/<name>.repository.ts`                |
| `use-cases/<name>.use-case.ts`                     | `application/use-cases/<name>/<name>.use-case.ts`         |
| `services/<name>.service.ts`                       | `application/services/<name>.service.ts`                  |
| `infrastructure/persistence/*.ts`                  | `infrastructure/persistence/prisma/*.ts`                  |
| `presentation/<name>.controller.ts`                | `presentation/http/<name>.controller.ts`                  |
| `dto/request/*.ts`, `dto/response/*.ts`            | `presentation/http/dto/request/*.ts`, `.../response/*.ts` |

`constants/` stays at the module root. `domain/entities/` does not move.

**1. Find every external consumer first.** This is your fix-up list for step 6;
empty means the module is self-contained.

```bash
grep -rln "<module>/domain/interfaces\|<module>/use-cases\|<module>/dto/\|<module>/presentation/\|<module>/infrastructure/persistence" src
```

**2. Move the port.** Same depth, so its own imports do not change.

```bash
mkdir -p src/inventory/<module>/domain/repositories
git mv src/inventory/<module>/domain/interfaces/<name>-repository.interface.ts \
       src/inventory/<module>/domain/repositories/<name>.repository.ts
rmdir src/inventory/<module>/domain/interfaces
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
npx prettier --write "src/inventory/<module>/**/*.ts"
pnpm run validate                       # the whole pipeline, including build
```

**9. Commit, scoped to the module.**

```bash
git add -A -- src/inventory/<module>/
git diff --cached --stat                # READ THIS before committing
git commit -m "refactor(<module>): migrate to Clean Architecture layering"
```

**Suggested order:** `reference-data/category` (the rehearsal) → the other four
`reference-data` sub-modules → `asset` → `approval` → `circulation` last, and
**write its specs before converting it**, not after. Moving five untested use
cases and then asking whether they still work is the one sequence that cannot
be verified.

The original `reference-data/category` rehearsal remains useful as a pattern.
The service-wide migration is now complete. Focused and full validation evidence
lives in `specs/003-inventory-service-migration/quickstart.md`.

## What this layering deliberately does not do

Stated once, here, so it isn't relitigated module by module:

- **No domain events.** A module needing another module's result makes a direct,
  awaited call into that module's exported use case. `@nestjs/event-emitter` is
  not a dependency.
- **No value objects for primitives.** An asset code, a quantity, a date range is
  validated by a policy function at the boundary (`domain/policies/`), not
  wrapped in a class.
- **A repository port's input/output types are declared next to the port**, in
  the same file as the abstract class — never a bare domain entity passed into
  `create()`/`update()`.
- **A mapper file is the exception, not the default.** Reach for
  `infrastructure/mappers/` only when a row's outward shape genuinely differs
  from what Prisma returns. `prisma-asset.includes.ts` is the right pattern for
  the common case: name the `include` shape, skip the mapper.

---

# PART 2 — THE SERVICE BOUNDARY

## This is the reference implementation

This service was the first service-boundary reference implementation. Three
facts matter here:

1. **Its own database.** `DATABASE_URL` names `/inventory`.
2. **Its whole schema.** `prisma/inventory.prisma` declares all 15 models in
   that database. Nothing is missing and nothing is borrowed.
3. **It carries its migrations.** `prisma/migrations/` exists, and the
   deployment stage applies them with `pnpm prisma:deploy` before the runtime
   stage starts the compiled app.

The runtime command is intentionally separate from migration execution:
`start:prod` runs `node dist/src/main.js`. Keep migration application in the
deployment stage so startup does not mutate the database implicitly.

## How a caller is identified

This service has no `users` table, no `auth_sessions` table, and no permission
repository. It asks.

```
JwtStrategy.validate(token)
  └─> IIdentityPort.resolve(token)                    src/platform/identity/identity.port.ts
        └─> HttpIdentityAdapter                       src/platform/identity/http-identity.adapter.ts
              └─> POST {IDENTITY_SERVICE_URL}/auth/introspect
                    -> { userId, identifier, sessionId, roles, permissions } | null
```

`IIdentityPort` is a real port: an abstract class in `platform/identity/`
declaring one method, with an HTTP adapter behind it. Swapping the transport, or
faking it in a test, touches one file.

Three decisions are baked into the adapter and must not be reversed casually:

- **It caches, for `IDENTITY_CACHE_TTL_MS` (default 5000).** Without a cache
  this is one HTTP round trip per authenticated request — worse than the
  database read it replaced. With one, the price is staleness: a session revoked
  now keeps working for up to the TTL. Separating the database did not make
  revocation free; it made it eventually consistent within a bounded window.
  Zero is allowed and means no cache.
- **Unreachable is 503, not 401.** A 401 sends an operator to check their
  password; a 503 says the platform is degraded. Failing closed is the only safe
  direction for an authorization dependency.
- **`IDENTITY_SERVICE_URL` unset is 503 at request time**, not a silent pass.

`platform/auth` and `platform/access-control` are what remains local: the JWT
signature check, `JwtAuthGuard`, `PermissionGuard`, and the
`@RequirePermissions` decorator. They decide _against_ the roles and permissions
the port returned. They never look anything up.

## The published contract this depends on

`identity.port.ts` declares the shape this service expects from
`POST /auth/introspect`. `identity-service` declares the same shape in
`IntrospectionResponseDto`. **They are two copies of one contract, in two repos
that do not build together.**

- A change to that endpoint's response changes both files in the same PR pair.
- `identity-service` treats the DTO as append-only for exactly this reason.
- If a field this service reads goes missing, every request here fails closed
  with a 503 — loudly, which is the intended failure mode, but it will be
  noticed in production, not in CI.

That is the residual risk of separation, and it is the right trade. It is worth
naming rather than discovering.

## Naming the boundary correctly

`platform/identity` is a **port and adapter**, and once `identity-service`'s wire
format diverges from this service's internal `Identity` shape it will also be a
genuine **Anti-Corruption Layer** — it will translate another context's model
into this one's. Today the shapes match, so the ACL is latent, not active. Use
the term when it becomes true.

Do not call `platform/auth` an ACL. It verifies a signature; it translates
nothing.

## Remaining service-boundary work

Nothing, structurally. Two smaller items remain:

- **The cache is per-process and bounded.** Since 2026-09-09 it uses token
  digests, TTL expiry and a configurable maximum entry count. Concurrent requests
  for the same token share one lookup. See `IDENTITY-BOUNDARY.md`.
- **There is no circuit breaker.** When `identity-service` is down, every request
  here pays at most `IDENTITY_TIMEOUT_MS` before its 503. A configurable
  concurrency limit bounds distinct pending lookups; failures are not cached.

---

# PITFALLS

**Never `git add -A` or `git add .` without a path.** Scope to the module, and
read `git diff --cached --stat` before committing. To tell a real change from
line-ending noise: `git diff --ignore-cr-at-eol -- <path>` — empty means no real
change.

**Circulation and approval now have focused coverage.** Preserve those suites
when changing borrow, return, or approval consequences.

**Approval migration deployment is separate from runtime startup.** The approved
migration is applied to the configured local database. Apply it with
`pnpm prisma:deploy` in each deployment environment before using approval
consequence retry state there.

**Zero comments in business code.** Do not add explanatory comments, and when
relocating a file, strip the comments it already carries in the same pass.
Swagger `@ApiProperty({ description })` is API documentation and stays. The
prose in `identity.port.ts` and `http-identity.adapter.ts` is the sanctioned
exception — a trade-off at a service boundary; see `CLEAN-CODE.md`, "comment
rules".

**Do not add a `users` or `roles` table here.** If this service needs to know
something about a person that introspection does not return, the answer is to
extend the contract with `identity-service`, not to grow a local copy of it. A local
copy is how the shared database happened the first time.

**Dead code found on the way** gets deleted, and the commit message says so.
Grep the whole tree first; a method reachable through a differently-named port
method is not dead.
