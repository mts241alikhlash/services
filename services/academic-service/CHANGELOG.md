# academic-service

## 1.3.0

### Minor Changes

- 785d574: A schedule now carries its exam type (UH, QUIZ, TUGAS, UTS or UAS), required when it is created or changed and frozen once a student has started. The student exam list reports the type and the subject name, so the apps can title an exam "UTS - IPA"; the name comes from the new internal POST /subjects/by-ids in academic-service, and a failing lookup leaves it null instead of hiding the exams. Existing schedules become UH. The student paper is now grouped by question type (multiple choice first, then true/false, short answer and essay), still shuffled inside each type and per seed. The grading schedule list reports the type too. POST /student-exams/{sessionId}/submit takes an optional `violations` count, kept on the session (never lowered) and shown as `violationCount` in the session lists, so staff can tell an exam the app handed in after the student left it too often.

### Patch Changes

- 78ab363: Images run with `NODE_ENV=production` unless the environment overrides it, so a missing variable can no longer expose reset tokens or skip the production checks.

## 1.2.1

### Patch Changes

- 53cb2e8: Run on Node.js 24.22.1, the release that fixes the October 2026 security issues (Brotli decoder out-of-bounds write, TLS hostname checks, DNS NUL handling). The base image, the CI jobs and the engines range move from 24.21.0 to 24.22.1.

## 1.2.0

### Minor Changes

- f8e8796: Pencarian semester internal menampilkan `startDate` dan `endDate` (tanggal ISO, `null` bila belum diisi).

## 1.1.1

### Patch Changes

- 655a509: Ejaan Amerika di seluruh kode: `enrolment` menjadi `enrollment` dan `enrol` menjadi `enroll`, juga `summarise`, `normalise`, `serialise`, `recognise`, `authorise`, `colour`, `centre`, `catalogue`, `honour`, `labelled`.
  
  Perubahan kontrak: `admissions/enrolments/*` menjadi `admissions/enrollments/*`, `POST students/enrol` menjadi `POST students/enroll`, kode izin `admission-enrolments.read|process|nis` menjadi `admission-enrollments.read|process|nis`, serta nama DTO dan operationId di kontrak OpenAPI dan klien yang dihasilkan.
  
  identity-service: migrasi `20261019100000_rename_admission_enrolment_permissions` mengganti kode izin di tabel `permissions`, jadi peran yang sudah ada (termasuk yang diubah tangan) tetap memegang izinnya. Rilis bersama admission-web dan academic-web; token akses lama membawa kode lama sampai diperbarui.

## 1.1.0

### Minor Changes

- 0754ace: `GET /grades/active` (provisioning token) lists the active grades with their ids and levels, lowest first, for the admission sign-up.

## 1.0.0

### Major Changes

- First stable release.
