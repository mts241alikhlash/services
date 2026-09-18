# Review: T024

Review verdict: PARTIAL.

Required fixes:

- Assert exact stable role-mismatch and no-next-approver messages.
- Assert `processApprovalTransaction` is not called when role validation fails.
- Add `findLoanDetailsForInstance()` returning `null` coverage.
- Strengthen intermediate/final transaction argument assertions for action, pending status, note, and identifiers.
- Keep existing create-workflow validation coverage in scope only if changed by T024; otherwise record it as pre-existing follow-up.

Evidence before fix:

- Focused approval use-case tests: 5 suites, 34 tests passed.
- Prettier, ESLint, strict ESLint, and typecheck passed.
