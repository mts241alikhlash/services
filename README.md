# 241 Services

Nine independent NestJS microservices for 241 Apps, a school platform, sharing
one pnpm workspace with independent runtime, database, migration, image, and
release boundaries:

| Service | Product | Port | Database |
| --- | --- | --- | --- |
| `identity-service` | 241 Console | 3000 | `identity_service` |
| `academic-service` | 241 Academic | 3200 | `academic_service` |
| `inventory-service` | 241 Inventory | 3300 | `inventory_service` |
| `presence-service` | 241 Presence | 3400 | `presence_service` |
| `portal-service` | 241 Portal | 3600 | `portal_service` |
| `admission-service` | 241 Admission | 3700 | `admission_service` |
| `hr-service` | 241 HR | 3800 | `hr_service` |
| `student-service` | 241 Academic | 3900 | `student_service` |
| `assessment-service` | 241 Academic | 4000 | `assessment_service` |

Each service owns its own database and Prisma migrations. Cross-service calls
go over HTTP through a shared `src/platform/identity/` slice, never through
another service's Prisma client. `packages/*-api` are published, generated
OpenAPI TypeScript clients — the supported way in from outside HTTP.

Run one service with `pnpm --filter <service-name> <command>`; do not import
another service's source. See each service's own `docs/OVERVIEW.md` for its
routes, gaps, and dependencies.

```bash
cd <service> && pnpm install && pnpm prisma:generate && pnpm prisma:deploy && pnpm dev
```

## Admission stack: local development and deployment

The admission app uses `identity-service`, `academic-service`, and
`admission-service`; enrolment also uses `student-service`. These four services
pin the Prisma CLI, Client, and PostgreSQL adapter to **7.10.0**. Prisma 8's
release candidate is not part of this upgrade. Existing database schemas and
migration SQL are unchanged.

The local Docker PostgreSQL instance does not provide TLS. Both `DATABASE_URL`
and `DIRECT_URL` in each local `.env` must include `?sslmode=disable`: the runtime
SSL helper otherwise enables TLS even for localhost. This is a local-only
setting; do not copy it into staging or production connection strings.

From this workspace, install the locked dependencies and generate clients:

```bash
pnpm install --frozen-lockfile
pnpm --filter identity-service --filter academic-service --filter admission-service --filter student-service --workspace-concurrency=1 run prisma:generate
pnpm run runtime:check
```

`runtime:check` performs clean TypeScript watch compilation in memory, ignoring
incremental caches. It verifies the emitted entrypoints without writing `dist`,
starting services, or connecting to a database. Run it after generating clients.
The same check runs for each affected service in CI.

Start each service in its own terminal:

```bash
pnpm --filter identity-service dev
pnpm --filter academic-service dev
pnpm --filter admission-service dev
pnpm --filter student-service dev
```

The four build configs use `compilerOptions.rootDir: "."` to preserve
`dist/src/main.js`, which both `start:prod` and the Docker runner execute.
`rootDir` at the top level of `tsconfig.build.json` is invalid. Do not move it to
`compilerOptions.rootDir: "src"` without also changing the production and Docker
entrypoints and excluding root-level TypeScript inputs.

For staging or production, build new images from the updated manifests and
lockfile; the deployment's existing pinned images do not change automatically.
Each service's `prisma:deploy` remains a separate, explicit deployment step
against its own database. Do not migrate or reset a shared database.

Rollback uses the previously deployed image digest and dependency lockfile.
This change requires no database rollback because it adds no migrations.
Database connectivity, storage access, and HTTP health checks still need to be
verified in the target environment before promoting a release.
