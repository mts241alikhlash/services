# Review: T013-T021

Spec compliance: PARTIAL. Quality: NEEDS REVISION.

Important findings:

- Assert handler `PATH_METADATA` for route suffixes, not only controller prefixes.
- Assert DTO metatypes from production route metadata, not manually supplied metatypes only.
- Use global ValidationPipe options including `forbidNonWhitelisted: true`.
- Add `AssetQueryDto` validation coverage.
- Assert permission denial as `403`; add missing location/status denial coverage.
- Strengthen DTO rule coverage: funding-source limits, location field limits, status system-key enum, asset-unit lendable transform, loan requester UUID, nested workflow validation.

Minor findings:

- Response envelope checks are controller pass-through only; global interceptor is tested separately.
- Direct method calls should use valid UUIDs where UUID pipes are part of the contract.
- Tasks remain unchecked until review passes.
