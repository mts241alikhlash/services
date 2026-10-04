# Data Model: Layered Admission Contexts

Each context retains the Stage 1 aggregate ownership and database shape. Layer
boundaries add no tables, fields, migrations, or cross-service payload changes.

The application aggregate is special:

- status policy remains in `domain/policies/admission-status.transitions.ts`
- enrolment integration remains behind an integration port
- local application status writes remain behind the application repository port
