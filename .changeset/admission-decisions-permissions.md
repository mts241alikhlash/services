---
'identity-service': minor
---

Permissions `admission-decisions.read` and `admission-decisions.decide` for the admission decision queue. Kepala Madrasah, Wakamad Kurikulum and Wakamad Kesantrian may decide; Admin PPDB and Operator may only read the queue (`admission-decisions.decide` is explicit-only, like `admissions.apply`). Wakamad Kurikulum also gets `admissions.read` to open an applicant and a file.
