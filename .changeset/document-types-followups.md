---
'admission-service': patch
'identity-service': minor
---

A new permission code is now granted by `seed:permissions` to the existing default roles whose definition includes it, in the run that creates the code; edited roles are never reset. Document types: a PATCH with a null field answers 400 instead of 500, a delete that races an upload and a concurrent duplicate create answer 409 with the Indonesian message.
