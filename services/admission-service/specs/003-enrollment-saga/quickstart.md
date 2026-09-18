# Quickstart: Enrollment Saga

Run admission tests:

```bash
cd admission-service
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=enroll
pnpm run validate
```

Run student tests:

```bash
cd student-service
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=enrol
pnpm run validate
```

Required scenarios: remote failure, local mark failure, retry from `ENROLLING`,
completed-state rejection, duplicate request, NIS/NISN conflicts, and existing
student return.
