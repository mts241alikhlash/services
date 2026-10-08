---
'hr-service': patch
---

Creating an employee no longer reports success when the account profile cannot be read back, and a failed account cleanup is reported together with the original error instead of hiding it. An empty identifier or password falls back to the NIP, NUPTK or NIK like an absent one. Updating a salary component with a null driver is now checked against its type. Adds behavior tests for employee account creation, salary components and assignments, employment types, position categories, and removes assertions that only restated their fixtures.
