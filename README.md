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
another service's Prisma client. `packages/api-*` are published, generated
OpenAPI TypeScript clients — the supported way in from outside HTTP.

Run one service with `pnpm --filter <service-name> <command>`; do not import
another service's source. See each service's own `docs/OVERVIEW.md` for its
routes, gaps, and dependencies.

```bash
cd <service> && pnpm install && pnpm prisma:generate && pnpm prisma:deploy && pnpm dev
```
