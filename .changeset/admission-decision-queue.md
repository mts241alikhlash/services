---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
---

Decision queue for the principal and the deputies: `GET /admissions/decisions` (tabs Menunggu keputusan, Diterima, Ditolak with counts), `POST /admissions/decisions/:applicationId/accept` and `/reject` (VERIFIED applicants only, reason required to reject), `POST /admissions/decisions/accept-many` (up to 50 applicants, a result per applicant), and `POST /admissions/decisions/:applicationId/cancel-acceptance` (until enrolment starts) and `/cancel-rejection` (the applicant goes back to review and is verified again at once when documents and payment allow), each with a reason and one notification. The detail endpoints that accept and reject an application now require `admission-decisions.decide` instead of `admissions.decide`; Admin PPDB and Operator can no longer decide.
