# Public HTTP Preservation Contract

Baseline captured from `inventory-service/src/inventory/` on 2026-09-14. Every
inventory controller has `@UseGuards(JwtAuthGuard)` and every route below has a
`@RequirePermissions(...)` decorator. `JwtAuthGuard` is also a global
`APP_GUARD`; `PermissionGuard` is the global permission guard. `SUPER_ADMIN` is
the only centralized permission bypass, implemented in
`src/platform/access-control/permission/guards/permission.guard.ts`.

## Route Inventory

| Method | Path                              | Permission                        | Request DTO/input                                        | Success status | Success data                                    |
| ------ | --------------------------------- | --------------------------------- | -------------------------------------------------------- | -------------: | ----------------------------------------------- |
| GET    | `/inventory/metadata`             | `inventory-reference-data.read`   | none                                                     |            200 | `InventoryMetadataResponseDto`                  |
| GET    | `/inventory/categories`           | `inventory-reference-data.read`   | `search?: string`                                        |            200 | `InventoryCategoryResponseDto[]`                |
| POST   | `/inventory/categories`           | `inventory-reference-data.create` | `CreateCategoryDto`                                      |            201 | `InventoryCategoryResponseDto`                  |
| PATCH  | `/inventory/categories/:id`       | `inventory-reference-data.update` | UUID `id`, `UpdateCategoryDto`                           |            200 | `InventoryCategoryResponseDto`                  |
| DELETE | `/inventory/categories/:id`       | `inventory-reference-data.delete` | UUID `id`                                                |            204 | no body                                         |
| GET    | `/inventory/conditions`           | `inventory-reference-data.read`   | `search?: string`                                        |            200 | `InventoryConditionResponseDto[]`               |
| POST   | `/inventory/conditions`           | `inventory-reference-data.create` | `CreateConditionDto`                                     |            201 | `InventoryConditionResponseDto`                 |
| PATCH  | `/inventory/conditions/:id`       | `inventory-reference-data.update` | UUID `id`, `UpdateConditionDto`                          |            200 | `InventoryConditionResponseDto`                 |
| DELETE | `/inventory/conditions/:id`       | `inventory-reference-data.delete` | UUID `id`                                                |            204 | no body                                         |
| GET    | `/inventory/funding-sources`      | `inventory-reference-data.read`   | `search?: string`                                        |            200 | `InventoryFundingSourceResponseDto[]`           |
| POST   | `/inventory/funding-sources`      | `inventory-reference-data.create` | `CreateFundingSourceDto`                                 |            201 | `InventoryFundingSourceResponseDto`             |
| PATCH  | `/inventory/funding-sources/:id`  | `inventory-reference-data.update` | UUID `id`, `UpdateFundingSourceDto`                      |            200 | `InventoryFundingSourceResponseDto`             |
| DELETE | `/inventory/funding-sources/:id`  | `inventory-reference-data.delete` | UUID `id`                                                |            204 | no body                                         |
| GET    | `/inventory/locations`            | `inventory-reference-data.read`   | `search?: string`                                        |            200 | `InventoryLocationResponseDto[]`                |
| POST   | `/inventory/locations`            | `inventory-reference-data.create` | `CreateLocationDto`                                      |            201 | `InventoryLocationResponseDto`                  |
| PATCH  | `/inventory/locations/:id`        | `inventory-reference-data.update` | UUID `id`, `UpdateLocationDto`                           |            200 | `InventoryLocationResponseDto`                  |
| DELETE | `/inventory/locations/:id`        | `inventory-reference-data.delete` | UUID `id`                                                |            204 | no body                                         |
| GET    | `/inventory/statuses`             | `inventory-reference-data.read`   | `search?: string`                                        |            200 | `InventoryStatusResponseDto[]`                  |
| POST   | `/inventory/statuses`             | `inventory-reference-data.create` | `CreateStatusDto`                                        |            201 | `InventoryStatusResponseDto`                    |
| PATCH  | `/inventory/statuses/:id`         | `inventory-reference-data.update` | UUID `id`, `UpdateStatusDto`                             |            200 | `InventoryStatusResponseDto`                    |
| DELETE | `/inventory/statuses/:id`         | `inventory-reference-data.delete` | UUID `id`                                                |            204 | no body                                         |
| GET    | `/inventory/assets`               | `inventory-assets.read`           | `AssetQueryDto`                                          |            200 | paginated `AssetWithDetails[]`                  |
| GET    | `/inventory/assets/:id`           | `inventory-assets.read`           | UUID `id`                                                |            200 | `AssetWithDetails`                              |
| POST   | `/inventory/assets`               | `inventory-assets.create`         | `CreateAssetDto`                                         |            201 | `AssetWithDetails`                              |
| POST   | `/inventory/assets/:id/units`     | `inventory-assets.create`         | UUID `id`, `CreateUnitsDto`                              |            201 | `AssetWithDetails`                              |
| PATCH  | `/inventory/assets/:id`           | `inventory-assets.update`         | UUID `id`, `UpdateAssetDto`                              |            200 | `AssetWithDetails`                              |
| DELETE | `/inventory/assets/:id`           | `inventory-assets.delete`         | UUID `id`                                                |            204 | no body                                         |
| GET    | `/inventory/asset-units`          | `inventory-assets.read`           | `AssetUnitQueryDto`                                      |            200 | paginated `AssetUnitWithDetails[]`              |
| PATCH  | `/inventory/asset-units/:id`      | `inventory-assets.update`         | UUID `id`, `UpdateUnitDto`                               |            200 | `AssetUnitWithDetails`                          |
| DELETE | `/inventory/asset-units/:id`      | `inventory-assets.delete`         | UUID `id`                                                |            204 | no body                                         |
| GET    | `/inventory/loans`                | `inventory-loans.read`            | `LoanQueryDto`                                           |            200 | paginated loan rows                             |
| GET    | `/inventory/loans/:id`            | `inventory-loans.read`            | UUID `id`                                                |            200 | `LoanWithRelations`                             |
| POST   | `/inventory/loans`                | `inventory-loans.create`          | `CreateLoanDto`, current user ID                         |            201 | `LoanWithRelations`                             |
| POST   | `/inventory/loans/:id/return`     | `inventory-loans.update`          | UUID `id`, `ReturnLoanDto`, current user ID              |            200 | `LoanWithRelations`                             |
| GET    | `/inventory/histories`            | `inventory-loans.read`            | `HistoryQueryDto`                                        |            200 | paginated history rows                          |
| GET    | `/inventory/workflows`            | `inventory-approvals.read`        | none                                                     |            200 | `ApprovalWorkflow[]` with ordered steps         |
| GET    | `/inventory/workflows/:id`        | `inventory-approvals.read`        | UUID `id`                                                |            200 | `ApprovalWorkflow` with ordered steps           |
| POST   | `/inventory/workflows`            | `inventory-approvals.create`      | `CreateWorkflowDto`                                      |            201 | `ApprovalWorkflow` with ordered steps           |
| GET    | `/inventory/approvals`            | `inventory-approvals.read`        | current user roles                                       |            200 | approval instances plus optional loan `details` |
| POST   | `/inventory/approvals/:id/action` | `inventory-approvals.update`      | UUID `id`, `ApproveActionDto`, current user ID and roles |            200 | `ProcessApprovalResult`                         |

## DTO Facts

- `CreateCategoryDto` and `CreateConditionDto` require a non-empty string
  `code` and `name`; category also requires numeric
  `depreciationRatePercent` between 0 and 100, while condition accepts
  optional `isUsable`. Their update DTOs use Nest Swagger `PartialType`.
- `CreateFundingSourceDto` requires `code` and `name`, accepts optional
  `description`, and limits code/name to 20/100 characters. Update uses
  `PartialType`.
- `CreateLocationDto` requires `code` and `name`, accepts optional
  `building`, `room`, `rack`, and `description`; code/name/building/room/rack
  have 20/100/100/100/100 character limits. Update uses `PartialType`.
- `CreateStatusDto` requires `code` and `name`, accepts optional
  `allowTransactions` and nullable `systemKey` from `InventoryStatusKey`.
  Update uses `PartialType`.
- `AssetQueryDto` has optional positive integer `page` and `limit`, string
  `keyword`, `categoryId`, `locationId`, `statusId`, `conditionId`, and
  `fundingSourceId`.
- `AssetUnitQueryDto` has optional positive integer `page` and `limit`,
  boolean `lendable`, and string `search`. String `true` transforms to true;
  every other value transforms to false before boolean validation.
- `CreateAssetDto` requires `name`, UUID `categoryId`, ISO `purchaseDate`,
  non-negative numeric `purchasePrice`, UUID `locationId`, UUID `statusId`,
  and UUID `conditionId`. It accepts optional positive `quantity`, strings
  `brand`, `model`, `barcode`, `assetNumber`, non-negative numeric
  `usefulLifeMonths`, UUID `fundingSourceId`, and `notes`.
- `CreateUnitsDto` accepts optional positive `quantity` and requires UUID
  `conditionId`, `statusId`, and `locationId`.
- `UpdateAssetDto` has optional validated fields `name`, `categoryId`,
  `brand`, `model`, `assetNumber`, ISO `purchaseDate`, non-negative numeric
  `purchasePrice`, non-negative numeric `usefulLifeMonths`, UUID
  `fundingSourceId`, and `notes`.
- `UpdateUnitDto` has optional UUID `conditionId`, `statusId`, `locationId`,
  and `custodianId`, plus string `barcode` and `notes`.
- `LoanQueryDto` has optional positive integer `page` and `limit`, string
  `keyword`, string `statusId`, and UUID `requesterId`.
- `HistoryQueryDto` has optional positive integer `page` and `limit`, plus
  UUID `unitId`.
- `CreateLoanDto` requires ISO `expectedReturnDate`, non-empty string
  `purpose`, and a non-empty array of UUID `unitIds`.
- `ReturnLoanDto` requires an array of nested items. Each item requires UUID
  `unitId` and `returnedConditionId`, and accepts optional string `notes`.
- `CreateWorkflowDto` requires non-empty string `name`, `targetEntity`, and a
  nested `steps` array. Each step requires positive integer `stepSequence` and
  non-empty string `approverRoleCode`, and accepts optional boolean
  `isMandatory`.
- `ApproveActionDto` requires `action` equal to `APPROVE` or `REJECT`, and
  accepts optional string `note` and boolean `forwardToNextApprover`.

Global `ValidationPipe` uses `whitelist: true`, `forbidNonWhitelisted: true`,
`transform: true`, and implicit conversion. Path IDs use `ParseUUIDPipe`.

## Response and Error Facts

`ResponseInterceptor` is global. Normal responses use
`{ statusCode, message, data, meta? }`, with `message: "Success"`. A body with
`data`, `total`, `page`, and `limit` becomes `data: body.data` plus
`meta: { total, page, limit }`; `summary` is copied into `meta` when present.
Delete handlers set HTTP 204 and return no body. The two explicit action
handlers, loan return and approval action, set HTTP 200. Other POST, GET, and
PATCH statuses are Nest defaults shown above.

`HttpExceptionFilter` returns `{ statusCode, message, data: null }` for client
errors. Validation messages remain the exception's string array. Known Prisma
errors map P2002 to 409, P2025 to 404, P2003 to 400, and P2000/P2011 to 400.
Non-production 5xx responses additionally expose `error: "Internal Server
Error"` and `stack`; production uses the generic internal-server message.

JWT failure is 401. Missing or insufficient route permission is 403.
Identity-service unavailable, missing configuration, non-OK response, or
capacity exhaustion is 503 and authentication fails closed.

No endpoint, permission code, response envelope, or status code may change as
part of structural migration. Approval repair visibility must use existing
routes or be separately specified before adding an endpoint.

## T027 Characterization Reconciliation

Reviewed on 2026-09-14 against characterization specs and reports for
`reference-data`, `asset`, `circulation`, and `approval`.

### Exact Matches

| Contract area                                            | Evidence                                                                                                                           | Result                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route paths and methods                                  | T013-T021 controller specs, category and condition controller specs, metadata controller source/spec, and `task-013-021-report.md` | Exact match for all 40 listed routes. Controller prefixes, handler paths, and HTTP methods match this document.                                                                                                                                                                                             |
| Permissions                                              | T013-T021 controller specs and report                                                                                              | Exact match for all covered handlers. `SUPER_ADMIN` bypass remains guard behavior, not controller behavior.                                                                                                                                                                                                 |
| JWT guards                                               | T013-T021 controller specs and report                                                                                              | Exact match. All covered inventory controllers declare `JwtAuthGuard`.                                                                                                                                                                                                                                      |
| DTO wiring                                               | T013-T021 controller specs                                                                                                         | Exact match for covered request metatypes: reference-data bodies, asset and unit query/body DTOs, loan/history DTOs, and workflow/action DTOs. Current-user arguments remain `Object` runtime metatypes where expected.                                                                                     |
| Validation                                               | T013-T021 controller specs and DTO characterization                                                                                | Exact match for covered required fields, positive pagination, UUID fields, nested workflow/return data, status enum, boolean transformation, and whitelist/forbid-non-whitelisted pipe options.                                                                                                             |
| UUID handling                                            | T013-T021 controller specs                                                                                                         | Source-grounded fact: every documented path ID uses `ParseUUIDPipe`. Characterization evidence: asset, circulation, approval, funding-source, location, and status specs assert invalid IDs are rejected; category and condition specs assert rejection through `ParseUUIDPipe` but do not assert HTTP 400. |
| Success statuses                                         | T013-T021 controller specs and report                                                                                              | Exact match: POST create routes 201, explicit loan return and approval action 200, deletes 204, remaining GET/PATCH routes 200.                                                                                                                                                                             |
| Query forwarding                                         | T018-T019, T022-T023, and T013-T021 reports                                                                                        | Exact match. Asset, asset-unit, loan, history, reference-data search, lendable, pagination, keyword, status, requester, and unit filters forward unchanged to use cases/repositories.                                                                                                                       |
| Not-found behavior                                       | T022-T024 and T023 reports                                                                                                         | Exact match for characterized asset, asset-unit, loan, workflow, approval-instance, and missing-parent paths, including current exception messages and short-circuit behavior where tested.                                                                                                                 |
| T026 authorized and authentication-denial smoke evidence | `task-026-report.md`                                                                                                               | Exact observed results for authorized metadata 200, no-bearer 401, invalid input 400, unknown asset ID 404, and empty category result 200. Recorded responses show the documented envelope where response bodies were captured.                                                                             |

### Contract Mismatches

No route, method, permission, DTO metatype, validation rule, UUID pipe, query-forwarding,
not-found, or success-status mismatch was found between the documented contract and
the reviewed characterization evidence.

### Evidence Gaps, Not Contract Mismatches

- Reference-data category and condition controller specs verify delegation, route
  metadata, DTO metadata, UUID rejection through `ParseUUIDPipe`, and delete status,
  but do not independently assert returned response identity, HTTP 400 for invalid
  UUIDs, or the full global validation-pipe options.
- The metadata controller source and `get-metadata.use-case.spec.ts` confirm route,
  permission, guard, response DTO, and use-case delegation. No metadata controller
  characterization spec exists.
- Characterization controller tests mock already-enveloped values. They do not execute
  `ResponseInterceptor` for every route. Global envelope behavior is covered only by
  the interceptor tests and the T026 HTTP responses.
- Characterization use-case tests cover not-found and repository-error behavior for
  asset, asset-unit, circulation, and approval operations. They do not constitute a
  complete HTTP matrix for every documented error mapping in `HttpExceptionFilter`
  (409, 400 Prisma mappings, production/non-production 5xx shape).

### Carried T026 Blockers

T026 remains **PARTIAL EVIDENCE**, not full contract verification. Missing-permission
HTTP 403 was not executed because no safe non-`SUPER_ADMIN` credential was available.
Identity-service failure HTTP 503 was not executed because stopping or overriding the
shared identity-service was not authorized. The controller specs prove permission
guard denial as 403, and identity adapter tests prove failure mapping as 503, but no
end-to-end smoke result exists for either case. Do not claim those scenarios passed
until T026 runs them safely.
