# admission-service

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
