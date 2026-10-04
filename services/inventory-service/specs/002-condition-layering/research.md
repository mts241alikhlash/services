# Research: Condition Module Layering

## Decision 1: Use category as the structural template

- **Decision**: Match `src/inventory/reference-data/category/` for domain port, application use cases, Prisma adapter, HTTP presentation, module wiring, public index, and focused tests.
- **Rationale**: Category is the completed rehearsal and condition has the same four-operation reference-data shape.
- **Alternatives considered**: Designing a new structure would create a second pattern and increase migration cost.

## Decision 2: Preserve behavior before fixing semantics

- **Decision**: Keep current search, ordering, `isUsable` defaults, hard delete, and not-found behavior unchanged.
- **Rationale**: This slice changes boundaries, not domain behavior. Semantic fixes need separate decisions and regression coverage.
- **Alternatives considered**: Adding soft-delete filters or changing update defaults would mix migration with behavior changes.

## Decision 3: Expose the repository port through `condition/index.ts`

- **Decision**: Update `GetMetadataUseCase` to consume the public condition repository export.
- **Rationale**: Metadata is an external consumer of the condition module and must not reach through internal paths.
- **Alternatives considered**: Leaving the import in place would preserve a module-boundary violation.

## Decision 4: Keep plain application inputs

- **Decision**: Add `CreateConditionInput` and `UpdateConditionInput` only where structured input is required. Do not add mapper functions because the controller DTOs are structurally compatible.
- **Rationale**: TypeScript structural typing already crosses the boundary; naming DTOs in application would violate the dependency rule.
- **Alternatives considered**: Runtime mapper classes add code without translating fields.

## Decision 5: Verify with existing commands

- **Decision**: Run focused condition tests, typecheck, lint, strict lint, and `pnpm run validate`.
- **Rationale**: NodeNext import depth and Nest wiring are the likely migration failure points.
- **Alternatives considered**: A full suite without focused tests would make path failures slower to diagnose.
