# admission-service

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
