# identity-service

## 1.6.0

### Minor Changes

- 5bf6d00: Permissions `admission-decisions.read` and `admission-decisions.decide` for the admission decision queue. Kepala Madrasah, Wakamad Kurikulum and Wakamad Kesantrian may decide; Admin PPDB and Operator may only read the queue (`admission-decisions.decide` is explicit-only, like `admissions.apply`). Wakamad Kurikulum also gets `admissions.read` to open an applicant and a file.

## 1.5.0

### Minor Changes

- 93cc4c3: Permissions `admission-documents.read` and `admission-documents.verify` for the admission document review queue. The default roles Admin PPDB, Operator and TU Kesantrian (and the roles that include it) receive them when the permission seed runs; Bendahara does not.

## 1.4.1

### Patch Changes

- 50b5250: A refresh that races another refresh no longer kills the session. The refresh token a refresh replaces is remembered for 30 seconds: inside that window the old token gets a new access token (no new refresh token, no cookie change), and after it, or for any other token, the session is revoked as before. Two tabs or apps sending the same cookie at the same time no longer sign the user out. Adds two nullable columns to `auth_sessions`.

## 1.4.0

### Minor Changes

- c1e72cf: The treasurer works admission payments from a payment queue: `GET /admissions/payments` (tabs Menunggu, Terverifikasi, Ditolak with counts), `PATCH /admissions/payments/:applicationId/verify`, `POST /admissions/payments/:applicationId/cancel` (reason required, allowed until the application is decided), `POST /admissions/payments` (add a verified payment for an applicant, proof required) and `GET /admissions/payments/eligible-applications`, guarded by the new `admission-payments.read|verify|create` permissions. The existing payment verification endpoint is now guarded by `admission-payments.verify`. `TREASURER` holds the three permissions and no longer `admissions.verify`.
  
  Rejecting a payment that is already verified now answers 409 (cancel the verification first). Accepting, rejecting and verifying an application now lock the application row and answer 409 when a payment cancellation changed it first. Queue search treats `%` and `_` literally. `TREASURER` also gets `admission-waves.read` for the wave filter.
  
  Existing installs: the seed only adds permissions, it never removes them. Remove `admissions.verify` from the Bendahara role and add `admission-waves.read` to it in admin-web after deploying.

## 1.3.0

### Minor Changes

- 0b864c4: Add a structural EMPLOYEE role with self-service permissions for employee records, attendance, leave, and payslips. TEACHER retains academic permissions and receives the same employee self-service grants. The bundle is listed on the structural role and topped up at startup only while the role holds none of it, so a school that removes some of it keeps its edit. Structural roles are now ensured after the permission catalogue is synced.

## 1.2.0

### Minor Changes

- c9ffa85: A new permission code is now granted by `seed:permissions` to the existing default roles whose definition includes it, in the run that creates the code; edited roles are never reset. Document types: a PATCH with a null field answers 400 instead of 500, a delete that races an upload and a concurrent duplicate create answer 409 with the Indonesian message.

## 1.1.0

### Minor Changes

- 806a61e: Admins manage admission document types: `GET|POST /admissions/document-types`, `PATCH|DELETE /admissions/document-types/:id` and `PUT /admissions/document-types/order`, guarded by the new `admission-document-types.*` permissions (admission admins and operators manage them, student-affairs staff read them). A type's code is generated from its name and never changes; a used type can only be deactivated. The admin application read keeps an inactive type the application has uploaded.

## 1.0.0

### Major Changes

- First stable release.
