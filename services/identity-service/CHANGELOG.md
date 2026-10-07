# identity-service

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
