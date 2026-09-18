# Tasks: Admission Module Layering

- [x] T001 Layer `src/admission/wave/` into `domain/`, `application/`, `infrastructure/persistence/prisma/`, and `presentation/http/`; add inputs, public API, and module wiring; preserve behavior.
- [x] T002 Run wave tests, `pnpm run typecheck`, `pnpm run lint`, `pnpm run lint:strict`, boot test, and stale-import scan; write `wave-layering-checkpoint.md`.
- [x] T003 Layer `src/admission/announcement/` into the four target layers; preserve `notifyScope`, routes, permissions, and publication behavior.
- [x] T004 Run announcement tests and all slice gates; write `announcement-layering-checkpoint.md`.
- [x] T005 Layer `src/admission/applicant/` into the four target layers; remove DTO imports from application; preserve provisioning and self-service behavior.
- [x] T006 Run applicant tests and all slice gates; write `applicant-layering-checkpoint.md`.
- [x] T007 Layer `src/admission/document/` into the four target layers; preserve storage and verification behavior.
- [x] T008 Run document tests and all slice gates; write `document-layering-checkpoint.md`.
- [x] T009 Layer `src/admission/payment/` into the four target layers; preserve payment proof and verification behavior.
- [x] T010 Run payment tests and all slice gates; write `payment-layering-checkpoint.md`.
- [x] T011 Layer `src/admission/notification/` into the four target layers; expose only required notification public API.
- [x] T012 Run notification tests and all slice gates; write `notification-layering-checkpoint.md`.
- [x] T013 Layer `src/admission/application/` last; move status policy to `domain/policies/`, use cases to application, adapters to infrastructure, HTTP code to presentation, and keep current enrolment behavior.
- [x] T014 Run workflow/stats/rules tests and all slice gates; write `application-layering-checkpoint.md`.
- [x] T015 Search all seven contexts for forbidden dependency directions, stale paths, direct repository presentation imports, DTO application imports, and Prisma leaks. Fresh scans leave only seven classified intentional direct imports documented in `application-layering-checkpoint.md`.
- [x] T016 Run `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run lint:strict`, `pnpm test`, `pnpm run build`, and `pnpm run validate`; write `final-verification.md`.

## Dependencies

```text
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008
T008 -> T009 -> T010 -> T011 -> T012 -> T013 -> T014 -> T015 -> T016
```

## MVP

T001-T004 proves the first layered context. Full package requires T001-T016.
