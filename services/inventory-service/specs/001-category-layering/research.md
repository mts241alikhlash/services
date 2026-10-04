# Research: Category Module Layering

## Decision 1: Migrate one module per commit

- **Decision**: Move and layer only `reference-data/category` in this feature.
- **Rationale**: `docs/ARCHITECTURE.md` requires one module per commit. Category has four use cases, one repository, one controller, no cross-module callers, and is the smallest complete rehearsal.
- **Alternatives considered**: Migrating all five reference-data modules at once would reduce repetition but enlarge review and rollback scope. Migrating the whole inventory domain would mix structural work with asset, circulation, and approval behavior.

## Decision 2: Keep the current HTTP contract unchanged

- **Decision**: Preserve route paths, methods, permissions, DTO validation, status codes, response envelope, search semantics, ordering, and not-found errors.
- **Rationale**: The feature is an internal layering migration, not an API change. Existing inventory-web callers must not change.
- **Alternatives considered**: Re-shaping category responses during migration would make regressions hard to distinguish from intentional contract changes.

## Decision 3: Use repository ports with plain boundary types

- **Decision**: Keep an abstract repository port in `domain/repositories/`, define repository input/output types beside it, and implement it with a Prisma adapter under `infrastructure/persistence/prisma/`.
- **Rationale**: This matches Constitution Principles I and IV and the established `academic-service` pattern. It lets use-case tests run without Prisma.
- **Alternatives considered**: Keeping the existing `domain/interfaces/` name would preserve the old structure and make the rehearsal less useful. Passing Prisma types through the port would couple the domain to persistence.

## Decision 4: Use plain application inputs, without mappers by default

- **Decision**: Add `CreateCategoryInput` and `UpdateCategoryInput` where structured input is needed. Do not add a DTO-to-input mapper when the shapes are structurally identical.
- **Rationale**: The constitution explicitly allows structural assignment and forbids unnecessary mapper code. The use case must name the application input, not the HTTP DTO.
- **Alternatives considered**: Explicit mapper functions would add code without translating a different shape. Reusing DTO types would violate the application-to-presentation dependency rule.

## Decision 5: Preserve existing persistence semantics unless tests expose a defect

- **Decision**: Do not add soft-delete, uniqueness, validation, or transaction behavior in this migration. Capture current behavior with tests and move code only.
- **Rationale**: Category currently deletes through Prisma `delete` and searches without an explicit `deletedAt` filter. Changing that behavior belongs to a separate domain decision, not a structural migration.
- **Alternatives considered**: Fixing persistence semantics during the move would create a mixed refactor and make API behavior comparison ambiguous.

## Decision 6: Verification uses existing service commands

- **Decision**: Run focused category tests first, then `typecheck`, `lint`, `lint:strict`, and full `validate`.
- **Rationale**: NodeNext relative import depth is a known migration failure mode, while the service constitution requires the full validation pipeline before merge.
- **Alternatives considered**: Running only the full pipeline would slow feedback and obscure whether a failure came from the category slice.
