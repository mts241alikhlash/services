# academic-service

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
