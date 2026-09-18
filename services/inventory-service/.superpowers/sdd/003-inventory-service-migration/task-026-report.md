# T026 Report: HTTP Smoke Scenarios

Date: 2026-09-14
Status: PARTIAL EVIDENCE

## Scope

T026 ran against existing routes and existing local configuration. No env,
schema, package, or source file changed. Inventory started transiently on port
3300 and was stopped after requests completed. No destructive inventory request
was sent.

## Preconditions

Commands:

```text
powershell -NoProfile -Command "$ports = 3000,3300,5433; foreach ($p in $ports) { $r = Test-NetConnection -ComputerName 127.0.0.1 -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue; Write-Output ('127.0.0.1:' + $p + ' listening=' + $r) }"
pnpm prisma migrate status
curl.exe -sS -i --max-time 5 http://localhost:3000/health
```

Results:

```text
127.0.0.1:3000 listening=True
127.0.0.1:3300 listening=False
127.0.0.1:5433 listening=True
Database schema is up to date!
HTTP/1.1 200 OK
{"statusCode":200,"message":"Success","data":{"status":"ok","info":{"database":{"status":"up"},"memory_heap":{"status":"up"}},"error":{},"details":{"database":{"status":"up"},"memory_heap":{"status":"up"}}}
```

Inventory `.env` configured `PORT=3300`, database
`localhost:5433/inventory_service`, and identity `http://localhost:3000`.

## Execution

Transient command:

```text
python "C:\Users\VaalLz\.agents\skills\webapp-testing\scripts\with_server.py" --server "pnpm start" --port 3300 --timeout 60 -- node -e "<Node fetch script below>"
```

Exact requests sent by Node `fetch`, in order:

```text
POST http://127.0.0.1:3000/auth/login
GET  http://127.0.0.1:3300/inventory/metadata        Authorization: Bearer <in-memory access token>
GET  http://127.0.0.1:3300/inventory/metadata
GET  http://127.0.0.1:3300/inventory/assets?page=0   Authorization: Bearer <in-memory access token>
GET  http://127.0.0.1:3300/inventory/assets/00000000-0000-0000-0000-000000000000  Authorization: Bearer <in-memory access token>
GET  http://127.0.0.1:3300/inventory/categories?search=__T026_NO_MATCH_9f6b2c__  Authorization: Bearer <in-memory access token>
```

Login body used existing workspace-seeded `admin` credentials from
`identity-service/prisma/seed-admin-minimal.ts`; password and token remained in
memory and are not recorded.

## Evidence

| Scenario | Route | HTTP result | Response/result |
|---|---|---:|---|
| Authorized credential | `POST /auth/login` on identity-service | 200 | Returned access token; user `admin`, role `SUPER_ADMIN`. |
| Authorized route | `GET /inventory/metadata` | 200 | Empty categories, locations, conditions, funding sources; six statuses returned. |
| Unauthorized, no bearer | `GET /inventory/metadata` | 401 | `{"statusCode":401,"message":"Unauthorized","data":null}` |
| Invalid input | `GET /inventory/assets?page=0` | 400 | `{"statusCode":400,"message":["page must not be less than 1"],"data":null}` |
| Unknown ID | `GET /inventory/assets/00000000-0000-0000-0000-000000000000` | 404 | `Asset with ID 00000000-0000-0000-0000-000000000000 not found` |
| Empty result | `GET /inventory/categories?search=__T026_NO_MATCH_9f6b2c__` | 200 | `{"statusCode":200,"message":"Success","data":[]}` |

## Blockers

Missing-permission `403` was not executed. No safe non-`SUPER_ADMIN` credential
was available in existing configuration. The observed `401` is recorded as
authentication denial, not permission denial.

Identity-service failure `503` was not executed. Identity-service was healthy on
configured `http://localhost:3000`; forcing failure would require stopping the
shared identity process or overriding process configuration. Neither action is
authorized by this run.

No smoke result is fabricated for either unexecuted scenario.

## Data Safety

Only identity login and inventory GET requests ran. No inventory create, update,
delete, loan, return, workflow creation, or approval action ran.
