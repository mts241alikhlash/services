# ARCHITECTURE

The one reference for how this service is built. Two halves:

- **Part 1 — inside a module.** The Clean Architecture layering `src/portal/` is
  being migrated to, and the procedure for converting a module.
- **Part 2 — between services.** What this service borrows from `identity-service`,
  the public surface it exposes to the open internet, and the shared database.

They are independent: a module can be perfectly layered and still wrongly
coupled, and the reverse.

`NESTJS-RULES.md` holds the coding rules (controllers, DTOs, validation,
naming). Its two *structure* sections — `DOMAIN STRUCTURE` and
`MODULE STRUCTURE` — are superseded by Part 1 here. `IAM.md` holds how
authorization works and which service owns it. `CLEAN-CODE.md` covers what a
file looks like once it is in the right place.

---

# PART 1 — INSIDE A MODULE

## Where this service stands today

Measured 2026-09-02 against `src/portal/`:

| Signal | Count |
| --- | --- |
| Modules using the target `application/` layer | **0 of 8** |
| Use case **classes** | **69** |
| Files holding them | **32** — nine files hold between 2 and 9 each |
| Use case files importing a `*.dto.js` (application → presentation) | **19 of 30** |
| Files touching Prisma outside `infrastructure/` or `core/` | 1 |
| Controllers touching Prisma | 0 |
| Files over 300 lines | **0** |
| `.spec.ts` files | **36** — the best coverage of the nine services |

This service is the best-engineered of the five unmigrated ones. `post` already
does what the other services will have to learn: its repository is split into
`post.reader.ts`, `post.writer.ts`, `post.where.ts`, `post.includes.ts` and
`post.mapper.ts`, each under 200 lines, with `post.where.spec.ts` testing query
construction in isolation. Nothing here is over 300 lines.

It has one structural problem the others do not, and it is the main work of Part
1: **nine files hold more than one use case each.**

## The `manage-*.use-cases.ts` problem

```
agenda/use-cases/manage-agenda.use-cases.ts     289 lines, 9 exported use cases
page/use-cases/manage-page.use-cases.ts         7 use cases
gallery/use-cases/manage-album.use-cases.ts     7 use cases
page/use-cases/manage-navigation.use-cases.ts   6 use cases
taxonomy/use-cases/manage-category.use-cases.ts 5 use cases
gallery/use-cases/manage-photo.use-cases.ts     4 use cases
taxonomy/use-cases/manage-tag.use-cases.ts      4 use cases
agenda/use-cases/get-public-agenda.use-case.ts  2 use cases
gallery/use-cases/get-public-album.use-case.ts  2 use cases
```

`manage-agenda.use-cases.ts` holds `GetAgendaEntries`, `GetAgendaById`,
`CreateAgenda`, `UpdateAgenda`, `PublishAgenda`, `UnpublishAgenda`,
`ArchiveAgenda`, `DeleteAgenda` and `RestoreAgenda`. Each is a separate business
decision with its own permission, its own failure modes, and — in
`manage-agenda.use-cases.spec.ts` — its own tests, all in one describe file.

Why this matters beyond tidiness:

- **The file never stops growing.** Adding a tenth agenda operation has no
  natural home except this file, so it goes there. That is how a 289-line file
  becomes a 600-line one.
- **A change to one use case shows as a change to nine.** Every diff, every
  blame, every merge conflict is at the granularity of the whole group.
- **`.input.ts` has nowhere to go.** The target layout puts a use case's input
  type in its own folder next to it. Nine use cases in one file means nine input
  types in one file, or — what happens instead — nine use cases taking DTOs.

The two are the same problem: 19 of 30 use case files import a DTO, and the
multi-class files are where most of that concentrates.

Splitting is mechanical and safe: one `export class` per file, name the file
after the class, split the spec the same way, and the module's `providers` array
does not change.

## The target layout

`post` is the module to copy. It is the largest, the best tested, and it already
has the infrastructure split right — only the layer folders are missing:

```
post/
├── post.module.ts
├── index.ts
├── constants/post.constants.ts                 stays at the module root
├── domain/
│   ├── entities/post.entity.ts
│   ├── enums/{content-status,post-type}.enum.ts
│   ├── policies/                               self-contained rules go here
│   └── repositories/post.repository.ts         abstract = port + DI token
├── application/
│   ├── use-cases/
│   │   ├── create-post/
│   │   │   ├── create-post.input.ts
│   │   │   ├── create-post.use-case.ts
│   │   │   └── create-post.use-case.spec.ts
│   │   ├── publish-post/
│   │   ├── get-public-posts/
│   │   └── ...                                 one folder per use case
│   └── services/
│       ├── post-audit.service.ts
│       └── post-status-sync.service.ts
├── infrastructure/
│   ├── mappers/post.mapper.ts
│   └── persistence/prisma/
│       ├── prisma-post.repository.ts
│       ├── post.reader.ts
│       ├── post.writer.ts
│       ├── post.where.ts
│       ├── post.where.spec.ts
│       └── post.includes.ts
└── presentation/http/
    ├── post.controller.ts                      admin surface
    ├── post-public.controller.ts               public surface
    └── dto/
        ├── request/
        └── response/{post-admin,post-detail}.dto.ts
```

Two controllers in one module is correct here. The cut is by **audience**, not
by aggregate: `post-public.controller.ts` answers anonymous requests and returns
`PostDetailDto`; `post.controller.ts` answers authenticated ones and returns
`PostAdminDto`. Keep that cut — it is what makes "read only the fields the
caller shows" enforceable at the type level.

## The dependency rule

```
presentation ──> application ──> domain
infrastructure ─────────────────> domain
```

- `domain/` imports nothing from the other three layers.
- `application/` may import `domain/`. **Never Prisma, never a DTO.**
- `infrastructure/` implements a `domain/` port. The only place touching Prisma.
- `presentation/` may import `application/`. Never a repository, never Prisma.

## Which entity style — the deciding question

> **Can the aggregate enforce a rule entirely on its own, with no database
> lookup?** If yes, a class. If no, an interface.

**`Post` says yes for its lifecycle and no for its slug.** Draft → published →
archived, and whether a post may be pinned, are decided from fields the post
already holds. Slug uniqueness needs `findTakenPostSlugs()`.

That split is the normal case, and it is why the answer is a policy plus an
interface rather than a class: put the lifecycle rules in
`domain/policies/post-lifecycle.policy.ts`, leave `Post` an interface, and keep
slug resolution in the use case where it can reach the repository. A class whose
constructor cannot enforce the interesting invariant buys nothing.

Self-contained checks go in `domain/policies/`, never in the entity file — an
entity file describes shape, a policy file states a rule.

**Default to interface.** Reach for a class only when you can name the
self-contained rule *and* it covers the aggregate's real invariant.

## Three type boundaries

| Type | Lives in | Carries |
| --- | --- | --- |
| `XxxDto` | `presentation/http/dto/` | `class-validator` + `@ApiProperty` |
| `XxxInput` | `application/use-cases/<name>/` | nothing — a plain interface |
| `XxxRepositoryInput` | `domain/repositories/` | nothing — a plain interface |

They may be structurally identical. TypeScript is structural, so a controller
passes a Dto straight into a use case expecting an Input. **Do not write a
mapper for it.** What you must not do is let the use case *name* the Dto.

This service already gets the third boundary right. `post-repository.interface.ts`
declares `CreatePostInput`, `UpdatePostInput`, `PublishPostInput`,
`PostQueryInput`, `PublicPostQueryInput`, `RelatedPostQueryInput` and
`PostWithDetails` next to the port. That is the pattern; copy it into every
module.

Create `.input.ts` only when the use case takes structured input. One taking
`(id: string)` or nothing needs no Input file.

## Import depth

NodeNext ESM: **every relative import ends in `.js`** though the source is
`.ts`. A wrong `../` count is the most common conversion error, and
`pnpm run typecheck` catches every one.

| File location | → `src/` | → module root |
| --- | --- | --- |
| `<module>.module.ts`, `index.ts` | `../../` | `./` |
| `domain/{entities,repositories,policies}/x.ts` | `../../../../` | `../../` |
| `application/use-cases/<name>/x.ts` | `../../../../../` | `../../../` |
| `application/services/x.ts` | `../../../../` | `../../` |
| `infrastructure/persistence/prisma/x.ts` | `../../../../../` | `../../../` |
| `infrastructure/mappers/x.ts` | `../../../../` | `../../` |
| `presentation/http/x.controller.ts` | `../../../../` | `../../` |
| `presentation/http/dto/request/x.dto.ts` | `../../../../../../` | `../../../../` |

## Converting a module — the procedure

One module per commit, and for this service **step 0 comes first**.

**0. Split multi-class use case files.** One `export class` per file, named
after the class. Split the matching `.spec.ts` the same way. Do this as its own
commit, before any folder moves — a rename plus a split in one diff is
unreviewable.

Then, old layout → new:

| Old | New |
| --- | --- |
| `domain/interfaces/<name>-repository.interface.ts` | `domain/repositories/<name>.repository.ts` |
| `use-cases/<name>.use-case.ts` | `application/use-cases/<name>/<name>.use-case.ts` |
| `services/<name>.service.ts` | `application/services/<name>.service.ts` |
| `infrastructure/persistence/*.ts` | `infrastructure/persistence/prisma/*.ts` |
| `infrastructure/mappers/*.ts` | unchanged |
| `presentation/<name>.controller.ts` | `presentation/http/<name>.controller.ts` |
| `dto/request/*.ts`, `dto/response/*.ts` | `presentation/http/dto/request/*.ts`, `.../response/*.ts` |

`constants/` stays at the module root. `domain/entities/` and `domain/enums/` do
not move.

**1. Find every external consumer first.** This is your fix-up list for step 6;
empty means the module is self-contained.

```bash
grep -rln "<module>/domain/interfaces\|<module>/use-cases\|<module>/dto/\|<module>/presentation/\|<module>/infrastructure/persistence" src
```

**2. Move the port.** Same depth, so its own imports do not change.

```bash
mkdir -p src/portal/<module>/domain/repositories
git mv src/portal/<module>/domain/interfaces/<name>-repository.interface.ts \
       src/portal/<module>/domain/repositories/<name>.repository.ts
rmdir src/portal/<module>/domain/interfaces
```

**3. Move each use case into its own folder.** Add `.input.ts` where it used to
take a `*Dto`, and change the signature to the `Input`. Move its `.spec.ts`
alongside. Fix depths. Never add a spec to a use case that never had one, never
delete one that did.

**4. Move infrastructure** into `infrastructure/persistence/prisma/`. Mappers
stay in `infrastructure/mappers/`.

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
npx prettier --write "src/portal/<module>/**/*.ts"
pnpm run validate                       # the whole pipeline, including build
```

**9. Commit, scoped to the module.**

```bash
git add -A -- src/portal/<module>/
git diff --cached --stat                # READ THIS before committing
git commit -m "refactor(<module>): migrate to Clean Architecture layering"
```

**Suggested order:** `taxonomy` (two files to split, two specs, no dependents)
→ `agenda` → `gallery` → `page` → `media` → `homepage` → `post` last, because
every other module reads it and it is the one with real infrastructure to
preserve.

Done so far: none.

## What this layering deliberately does not do

Stated once, here, so it isn't relitigated module by module:

- **No domain events.** A module needing another module's result makes a direct,
  awaited call into that module's exported use case. `@nestjs/event-emitter` is
  not a dependency. `PostStatusSyncService` is a scheduled sweep, not an event
  bus, and it stays one.
- **No value objects for primitives.** A slug, a title, a publish date is
  validated by a policy function at the boundary (`domain/policies/`), not
  wrapped in a class.
- **A repository port's input/output types are declared next to the port** — as
  `post-repository.interface.ts` already does.
- **A mapper file is the exception, not the default.** `post.mapper.ts` earns
  its place: a post's outward shape flattens categories, tags and an author
  profile. `post.includes.ts` is the right pattern where no mapper is needed.

`post` has fourteen use case files and will pass the threshold where
`application/use-cases/` wants splitting into `commands/` and `queries/`. Split
it at conversion time, not later.

---

# PART 2 — THE SERVICE BOUNDARY

## What is owned, and what is borrowed

`src/portal/` is owned. Four platform pieces are borrowed from `identity-service`,
each narrowed to a read or a single write. **None is a second copy of
identity-service.**

| Here | May do | Left behind |
| --- | --- | --- |
| `platform/auth` | Verify a token, check the session is live | Login, refresh, logout, password reset, session cleanup |
| `platform/access-control` | `PermissionGuard` asking if the caller holds a permission | The use cases, the controller, the catalogue-sync hook |
| `platform/audit-log` | Write an audit entry for a content change | Reading and searching the audit log |
| `platform/file` | Resolve and serve an uploaded file | File administration |

> **The narrowing rule:** if a controller here would answer the same URL as one
> in `identity-service`, it does not belong here.

## The public surface — what makes this service different

This is the only service whose routes are reachable without a token, and that
changes what "boundary" means here. Three things follow.

**1. Public and admin are different controllers, not different branches.**
`post-public.controller.ts` and `post.controller.ts` are separate files with
separate response DTOs. A public route must never be an admin route with an `if`
on `request.user`. `PostDetailDto` is what an anonymous reader may see;
`PostAdminDto` is what an editor may see. The type is the boundary.

**2. Public routes are throttled separately.** `PORTAL_THROTTLE_TTL` and
`PORTAL_THROTTLE_LIMIT` exist because the public surface has a different threat
model from an authenticated API. Do not fold them into the global
`@nestjs/throttler` defaults.

**3. This service also serves the SPA.** `@nestjs/serve-static` serves the built
portal frontend from `PORTAL_DIST_PATH` (default `./public`). That makes this
repo both an API and a web host, and it is why `PORTAL_BASE_URL` and
`PPDB_BASE_URL` are configuration rather than constants — a link from the portal
to the admission frontend crosses a deployment boundary.

## Uploads and images

`core/storage` talks to S3 through `@aws-sdk/client-s3` with presigned URLs, and
`sharp` resizes on the way in. `file-type` sniffs the real content type rather
than trusting the extension or the client's `Content-Type` header. That check is
security, not tidiness: it is what stops an uploaded `.jpg` being served back as
HTML. Do not remove it, and do not add an upload path that bypasses it.

## Its own database, and who may migrate it

This service owns `portal_service` alone: **15 models** across 3 `.prisma`
files, every one of them a table this service is responsible for. Nothing else
reads or writes them, so migrating is simply how this service deploys.

`pnpm prisma:migrate` and `pnpm prisma:deploy` both ship.

> **`start:prod` still does not migrate.** It is `node dist/src/main.js` and
> nothing else. Do not "fix" this.

That is no longer about racing another service for a shared schema — it is
about who decides *when* the schema changes. Migrating on boot hands that
decision to whichever replica starts first, and races every extra replica.
Migration is an explicit deploy step: `--profile migrate` in
`docker-compose.prod.yml`, per service.

**This inverted on 2026-09-09**, and the earlier rule read the opposite way:
one shared database, a partial schema per service, and "there is no
`prisma:migrate` script here, deliberately" — because back then a migrate from
here would have dropped the tables the other services described. Both halves of
that are gone: the database is this service's, and the schema is complete for
it.

- `pnpm prisma:generate` is required before anything else, and is always safe.
- A schema change is made here and nowhere else. This service's schema is the
  only description of its database.
## Couplings, and what closing them means

| # | Coupling | Status |
| --- | --- | --- |
| 1 | Authorization reads iam's tables | **Open.** `platform/auth` reads `auth_sessions` and `users` per request through Prisma |
| 2 | Author bylines join to `profiles` | **Open, deliberately.** While both tables sit in one database the join is the faster read |
| 3 | Audit entries write iam's table | **Open.** `platform/audit-log` writes locally rather than calling `identity-service` |

Coupling 1 is the next to close, and the shape is already proven:
`inventory-service` replaced exactly this with `IIdentityPort` +
`HttpIdentityAdapter` calling `POST /auth/introspect`. Copy that, including its
two decisions — cache the introspection for a few seconds, and return 503 rather
than 401 when `identity-service` is unreachable.

Coupling 2 is the one to close last. A byline is a hot path on the public
surface, and the eventual shape has a name: a cached batch lookup standing in
for a cross-service join is a **cached read model** — generate a read-optimised
local copy instead of reaching across the boundary on every request, and accept
that the copy can lag. Build it stale-tolerant.

Only after all three can this service's database separate — and only then does
`prisma migrate` belong to it.

## Naming the boundary correctly

Do not call `platform/` an **Anti-Corruption Layer**. An ACL translates between
two *different* domain models at a boundary, and nothing there does that —
`platform/auth` reads `auth_sessions` and `users` through the identical Prisma
models `identity-service` itself uses. It becomes an accurate name only once a
coupling closes into a real HTTP call and something here has to translate
`identity-service`'s wire contract into this service's own shapes.

## Authorization rule, binding

**Permissions, never role names** — `@RequirePermissions('posts.publish')`,
module segment plural. `SUPER_ADMIN` is checked in exactly one place, the
`PermissionGuard`.

---

# PITFALLS

**Never `git add -A` or `git add .` without a path.** Scope to the module, and
read `git diff --cached --stat` before committing. To tell a real change from
line-ending noise: `git diff --ignore-cr-at-eol -- <path>` — empty means no real
change.

**Split the `manage-*.use-cases.ts` files as their own commit.** A split plus a
move in one diff cannot be reviewed, and these files carry the modules' tests.

**`public/` is a build output, not source.** `PORTAL_DIST_PATH` points at the
compiled portal frontend. Do not edit anything there and do not commit a rebuilt
bundle as part of a backend change.

**Do not weaken `file-type` sniffing on upload.** It is the check that stops an
uploaded file being served back as executable content.

**Zero comments in business code.** Do not add explanatory comments, and when
relocating a file, strip the comments it already carries in the same pass.
Swagger `@ApiProperty({ description })` is API documentation and stays. The one
sanctioned exception is a comment stating a **trade-off at a service boundary**
— see `CLEAN-CODE.md`, "comment rules".

**Dead code found on the way** gets deleted, and the commit message says so.
Grep the whole tree first; a method reachable through a differently-named port
method is not dead.
