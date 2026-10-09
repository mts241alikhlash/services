# admission-service

## 2.8.0

### Minor Changes

- 1c0084a: PPDB download files: staff with `admission-downloads.*` upload, rename, describe, replace, activate, reorder and delete PDF files (at most 5 MB, checked by header) under `/admissions/downloads`, and visitors list the active ones with `GET /admissions/downloads/active` and download one with `GET /admissions/downloads/:id/file` without signing in. Adds the table `admission_downloads` (migration `20261009010000_admission_downloads`).

## 2.7.1

### Patch Changes

- 0d1686c: The enrolment queue lists applicants in the same order the NIS is numbered in: by name without regard to letter case, ties by registration number. A name in lowercase no longer sorts after every name in capitals.

## 2.7.0

### Minor Changes

- 349adfb: Enrolment queue for TU Kesantrian: `GET /admissions/enrolments` (tabs Siap diproses, Tertahan, Selesai with counts and school years), NIS numbering (`GET /admissions/enrolments/nis-preview`, `POST /admissions/enrolments/nis` with the confirmed number of changes, `POST /admissions/enrolments/nis-lock`), bulk enrolment (`POST /admissions/enrolments/process`, up to 50 applicants with a result per applicant) and `PATCH /admissions/enrolments/:applicationId/placement`. NIS is the school-year code, the grade level and one alphabetical sequence per school year; students already created have their NIS updated in student-service in two steps. The single enrol endpoint now reads the NIS, NISN and grade from the application, which fixes the 400 for the missing grade, and requires `admission-enrolments.process` instead of `admissions.enroll`; Admin PPDB and Operator can no longer enrol.

## 2.6.0

### Minor Changes

- 0754ace: An applicant account can record whether it is a new or a transfer applicant and the grade it joins (`admissionType`, `targetGradeId`, optional on public and staff registration so older clients keep working), `GET /admissions/grades` (public) lists the active grades, and applications gain an `nis` column and the school-year NIS lock table. No behavior changes for existing applications.

## 2.5.0

### Minor Changes

- 5bf6d00: Decision queue for the principal and the deputies: `GET /admissions/decisions` (tabs Menunggu keputusan, Diterima, Ditolak with counts), `POST /admissions/decisions/:applicationId/accept` and `/reject` (VERIFIED applicants only, reason required to reject), `POST /admissions/decisions/accept-many` (up to 50 applicants, a result per applicant), and `POST /admissions/decisions/:applicationId/cancel-acceptance` (until enrolment starts) and `/cancel-rejection` (the applicant goes back to review and is verified again at once when documents and payment allow), each with a reason and one notification. The detail endpoints that accept and reject an application now require `admission-decisions.decide` instead of `admissions.decide`; Admin PPDB and Operator can no longer decide.

## 2.4.0

### Minor Changes

- 93cc4c3: Document review queue for staff: `GET /admissions/document-reviews` (tabs Menunggu, Perlu perbaikan, Selesai with counts), `GET /admissions/document-reviews/:applicationId`, `PATCH /admissions/document-reviews/:applicationId/documents/:documentId` (saves a decision without notifying the applicant) and `POST /admissions/document-reviews/:applicationId/send` (the only moment the applicant hears back; a rejected document or a data note returns the form with one notification). An application becomes VERIFIED automatically once it is submitted, every required document is approved and the payment is verified: after sending a result, after a payment is verified or added by the treasurer, and when an applicant resubmits with nothing left to review. The detail endpoints that approve a document, request a revision or verify an application now require `admission-documents.verify` instead of `admissions.verify`.

## 2.3.0

### Minor Changes

- 8249c82: `GET /admissions/files/:fileId` streams a document, payment proof or attachment of an admission record through the service (permission `admissions.read`), inline by default and as a download with `?download=1`. A file that no admission record owns answers 404.
  
  The guard requires every listed permission, so the endpoint takes one code and `admissions.read` is the one: a custom role that holds only `admission-payments.*` cannot open a payment proof until it also gets `admissions.read` in admin-web. The default roles (Bendahara through TU Keuangan, Admin PPDB, Operator, TU Kesantrian) already hold it.

## 2.2.0

### Minor Changes

- c1e72cf: The treasurer works admission payments from a payment queue: `GET /admissions/payments` (tabs Menunggu, Terverifikasi, Ditolak with counts), `PATCH /admissions/payments/:applicationId/verify`, `POST /admissions/payments/:applicationId/cancel` (reason required, allowed until the application is decided), `POST /admissions/payments` (add a verified payment for an applicant, proof required) and `GET /admissions/payments/eligible-applications`, guarded by the new `admission-payments.read|verify|create` permissions. The existing payment verification endpoint is now guarded by `admission-payments.verify`. `TREASURER` holds the three permissions and no longer `admissions.verify`.
  
  Rejecting a payment that is already verified now answers 409 (cancel the verification first). Accepting, rejecting and verifying an application now lock the application row and answer 409 when a payment cancellation changed it first. Queue search treats `%` and `_` literally. `TREASURER` also gets `admission-waves.read` for the wave filter.
  
  Existing installs: the seed only adds permissions, it never removes them. Remove `admissions.verify` from the Bendahara role and add `admission-waves.read` to it in admin-web after deploying.

## 2.1.1

### Patch Changes

- c9ffa85: A new permission code is now granted by `seed:permissions` to the existing default roles whose definition includes it, in the run that creates the code; edited roles are never reset. Document types: a PATCH with a null field answers 400 instead of 500, a delete that races an upload and a concurrent duplicate create answer 409 with the Indonesian message.

## 2.1.0

### Minor Changes

- 806a61e: Admins manage admission document types: `GET|POST /admissions/document-types`, `PATCH|DELETE /admissions/document-types/:id` and `PUT /admissions/document-types/order`, guarded by the new `admission-document-types.*` permissions (admission admins and operators manage them, student-affairs staff read them). A type's code is generated from its name and never changes; a used type can only be deactivated. The admin application read keeps an inactive type the application has uploaded.

## 2.0.0

### Major Changes

- 99c0a25: A wave's quota now counts applicants whose payment is verified. Verifying a payment locks the wave and answers 409 "Gelombang penuh" once the quota is met; the verification that fills a wave moves its unverified applicants to the next open wave of the same academic year and rebills them at that wave's fee. Public registration skips full waves, an admin registration or a proof upload into a full wave answers 409, wave summaries carry `filledCount`, stats rows carry `filled`, and application reads carry `waveIsFull`. Accepting no longer returns `quotaWarning`, which makes this a breaking contract change.

## 1.1.0

### Minor Changes

- faea0d6: `GET /admissions/stats` accepts `academicYearId` beside `waveId`, so the admin dashboard can show one academic year instead of every wave ever opened. Both query values are now validated as UUIDs through `AdmissionStatsQueryDto`; an invalid `waveId` used to reach the database and now answers 400.

## 1.0.0

### Major Changes

- First stable release.
