# Module Public API Contract

Each context's `index.ts` exports only types/use cases needed by another
context or the root composition module. It MUST NOT export Prisma adapters,
HTTP DTOs, or Nest module classes through a barrel when the NodeNext ESM rule
requires direct imports.
