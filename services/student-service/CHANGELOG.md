# student-service

## 2.1.0

### Minor Changes

- 14ad587: GET /students/me now carries the caller's own birth place, birth date, email and phone, read from identity-service; the roster and list endpoints still leave them out. GET /students/me/classroom now reports the semester the enrollment belongs to, as `semester` with its name and sequence, or null when it cannot be resolved.

### Patch Changes

- 78ab363: Images run with `NODE_ENV=production` unless the environment overrides it, so a missing variable can no longer expose reset tokens or skip the production checks.
- b2c2fc2: Accounts created without a password get a random one instead of their NIP, NUPTK, NIK or NIS.

## 2.0.1

### Patch Changes

- 53cb2e8: Run on Node.js 24.22.1, the release that fixes the October 2026 security issues (Brotli decoder out-of-bounds write, TLS hostname checks, DNS NUL handling). The base image, the CI jobs and the engines range move from 24.21.0 to 24.22.1.

## 2.0.0

### Major Changes

- 655a509: Ejaan Amerika di seluruh kode: `enrolment` menjadi `enrollment` dan `enrol` menjadi `enroll`, juga `summarise`, `normalise`, `serialise`, `recognise`, `authorise`, `colour`, `centre`, `catalogue`, `honour`, `labelled`.
  
  Perubahan kontrak: `admissions/enrolments/*` menjadi `admissions/enrollments/*`, `POST students/enrol` menjadi `POST students/enroll`, kode izin `admission-enrolments.read|process|nis` menjadi `admission-enrollments.read|process|nis`, serta nama DTO dan operationId di kontrak OpenAPI dan klien yang dihasilkan.
  
  identity-service: migrasi `20261019100000_rename_admission_enrolment_permissions` mengganti kode izin di tabel `permissions`, jadi peran yang sudah ada (termasuk yang diubah tangan) tetap memegang izinnya. Rilis bersama admission-web dan academic-web; token akses lama membawa kode lama sampai diperbarui.

## 1.0.0

### Major Changes

- First stable release.
