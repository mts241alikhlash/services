# Enrollment Contract

## Request additions

The admission-to-student request may add:

```json
{
  "applicationId": "uuid"
}
```

The existing `userId`, NIS/NISN, profile, parents, and address fields remain.

## Response

Existing response fields remain:

```json
{
  "studentId": "uuid",
  "parentsLinked": 0,
  "enrollmentCreated": true,
  "alreadyEnrolled": false
}
```

On retry, `alreadyEnrolled` is `true` and `studentId` identifies the existing
student. No duplicate resource is returned.
