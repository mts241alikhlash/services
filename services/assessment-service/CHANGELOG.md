# assessment-service

## 1.1.0

### Minor Changes

- 6c0ba91: Teachers grade the short answers and essays of their classes in exam-service; the last grade closes the session and its score is posted by a minute job, with backoff, to the new exam_scores table in assessment-service (separate from student scores and the report card). Blank manual answers score 0 at once. Schedules now report hasSessions and the session list carries student names. identity-service gains exam-grading.read|grade|manage-all and exam-scores.read|read-all; edited roles need the new codes in admin-web. exam-service now requires ASSESSMENT_SERVICE_URL.

### Patch Changes

- 78ab363: Images run with `NODE_ENV=production` unless the environment overrides it, so a missing variable can no longer expose reset tokens or skip the production checks.

## 1.0.2

### Patch Changes

- 53cb2e8: Run on Node.js 24.22.1, the release that fixes the October 2026 security issues (Brotli decoder out-of-bounds write, TLS hostname checks, DNS NUL handling). The base image, the CI jobs and the engines range move from 24.21.0 to 24.22.1.

## 1.0.1

### Patch Changes

- 655a509: Ejaan Amerika di seluruh kode: `enrolment` menjadi `enrollment` dan `enrol` menjadi `enroll`, juga `summarise`, `normalise`, `serialise`, `recognise`, `authorise`, `colour`, `centre`, `catalogue`, `honour`, `labelled`.
  
  Perubahan kontrak: `admissions/enrolments/*` menjadi `admissions/enrollments/*`, `POST students/enrol` menjadi `POST students/enroll`, kode izin `admission-enrolments.read|process|nis` menjadi `admission-enrollments.read|process|nis`, serta nama DTO dan operationId di kontrak OpenAPI dan klien yang dihasilkan.
  
  identity-service: migrasi `20261019100000_rename_admission_enrolment_permissions` mengganti kode izin di tabel `permissions`, jadi peran yang sudah ada (termasuk yang diubah tangan) tetap memegang izinnya. Rilis bersama admission-web dan academic-web; token akses lama membawa kode lama sampai diperbarui.

## 1.0.0

### Major Changes

- First stable release.
