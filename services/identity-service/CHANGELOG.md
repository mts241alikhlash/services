# identity-service

## 1.14.0

### Minor Changes

- 6c0ba91: Teachers grade the short answers and essays of their classes in exam-service; the last grade closes the session and its score is posted by a minute job, with backoff, to the new exam_scores table in assessment-service (separate from student scores and the report card). Blank manual answers score 0 at once. Schedules now report hasSessions and the session list carries student names. identity-service gains exam-grading.read|grade|manage-all and exam-scores.read|read-all; edited roles need the new codes in admin-web. exam-service now requires ASSESSMENT_SERVICE_URL.
- 72cffb6: Add exam packages and schedules to the exam service: packages pin the approved version of each question and lock when scheduled, schedules tie a package to a classroom with a time window and duration, and the access code students enter is derived from the schedule and never stored. Identity gains the exam-packages and exam-schedules permission codes, given only through the curriculum staff, the deputy for curriculum and the academic admin roles. exam-service now needs EXAM_ACCESS_CODE_SECRET (at least 32 characters).
- 1d018b8: Add exam sessions for students: GET /me/exams, start with the access code (device bound, five wrong codes lock for five minutes), the shuffled paper without keys, idempotent answers, submit, automatic scoring of objective questions and a minute job that closes sessions past their finalize time. Supervisors list the sessions of a schedule and release a session from a device. A schedule with sessions cannot be cancelled and can only be extended. identity-service gains exam-sessions.take (students) and exam-sessions.read and release (curriculum staff); edited roles need the new codes in admin-web.
- 1c04cb4: Add /auth/native/login, /auth/native/refresh and /auth/native/logout for the Android exam app: tokens in the body without cookies, students and teachers only, a refresh bound to the tablet that signed in, and idempotent logout.
- ac69fb7: The TEACHER role now holds exam-packages.read, create, update and delete, so a teacher can build an exam package of their own subjects. Scheduling stays with curriculum staff.

### Patch Changes

- a71ddc1: Refresh in two tabs no longer signs the user out, and the reset link is mailed to the profile email.
- 78ab363: Images run with `NODE_ENV=production` unless the environment overrides it, so a missing variable can no longer expose reset tokens or skip the production checks.

## 1.13.0

### Minor Changes

- a5d3ed2: Add the exam question permissions (`exam-questions.read`, `create`, `update`, `delete`, `approve`, `manage-all`). Teachers get the four everyday codes, curriculum staff also get `manage-all`, and the deputy for curriculum also gets `approve`; `approve` and `manage-all` are never given through a broad grant.

## 1.12.1

### Patch Changes

- 53cb2e8: Run on Node.js 24.22.1, the release that fixes the October 2026 security issues (Brotli decoder out-of-bounds write, TLS hostname checks, DNS NUL handling). The base image, the CI jobs and the engines range move from 24.21.0 to 24.22.1.

## 1.12.0

### Minor Changes

- f8e8796: Berkas susulan: jenis berkas punya sifat Wajib, Susulan atau Opsional (batas 1 sampai 12 bulan sejak awal tahun ajaran untuk Susulan). Berkas susulan tidak menahan pengiriman, verifikasi, keputusan, atau daftar ulang. Menu Berkas Susulan (`admissions/late-documents`) menampilkan satu baris per siswa dan berkas untuk tahun ajaran PPDB, dengan unggah dan pemeriksaan oleh TU. Izin baru `admission-late-documents.read|upload|verify`.

## 1.11.0

### Minor Changes

- 655a509: Ejaan Amerika di seluruh kode: `enrolment` menjadi `enrollment` dan `enrol` menjadi `enroll`, juga `summarise`, `normalise`, `serialise`, `recognise`, `authorise`, `colour`, `centre`, `catalogue`, `honour`, `labelled`.
  
  Perubahan kontrak: `admissions/enrolments/*` menjadi `admissions/enrollments/*`, `POST students/enrol` menjadi `POST students/enroll`, kode izin `admission-enrolments.read|process|nis` menjadi `admission-enrollments.read|process|nis`, serta nama DTO dan operationId di kontrak OpenAPI dan klien yang dihasilkan.
  
  identity-service: migrasi `20261019100000_rename_admission_enrolment_permissions` mengganti kode izin di tabel `permissions`, jadi peran yang sudah ada (termasuk yang diubah tangan) tetap memegang izinnya. Rilis bersama admission-web dan academic-web; token akses lama membawa kode lama sampai diperbarui.

## 1.10.0

### Minor Changes

- 0a0483d: Adds the permissions `admission-landing.read`, `.update` and `.publish` for the PPDB landing page content. Admin PPDB and Operator receive all three, TU Kesantrian receives `read`. Roles edited by hand need the codes in admin-web.

## 1.9.0

### Minor Changes

- 1c0084a: Adds the permissions `admission-downloads.read`, `.create`, `.update` and `.delete` for the PPDB download files. Admin PPDB and Operator receive all four, TU Kesantrian receives `read`. Roles edited by hand need the codes in admin-web.

## 1.8.0

### Minor Changes

- c0d0dba: Profile addresses can carry a validated region code chain (province, regency, district, village). identity-service resolves codes against its region records, stores official names with them, and returns codes. Name-only addresses remain supported and leave region codes empty. Changing a region name without codes clears stored codes.

## 1.7.0

### Minor Changes

- 0754ace: Permissions `admission-enrolments.read`, `.process` and `.nis` for the admission enrolment queue. TU Kesantrian and Wakamad Kesantrian may enrol and number students; Admin PPDB and Operator may only read the queue (`.process` and `.nis` are explicit-only).

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
