# Approval Orchestration Contract

Status: approved for T083-T090.

## Purpose

Approval owns workflow, instance, and log state. Circulation owns loan and
history state. Asset owns unit state. Approval actions that finish or reject a
loan therefore use one approval-local transaction followed by awaited public
capability calls. No shared Prisma transaction crosses these module boundaries.

## Persistence changes

The existing `ApprovalLog` record is the action record and consequence state
record. It needs these approval-owned fields:

| Field | Values | Meaning |
|---|---|---|
| `consequenceType` | `NONE`, `FINAL_APPROVAL`, `REJECTION` | Whether the action has a downstream consequence and which one. |
| `consequenceStatus` | `NOT_REQUIRED`, `PENDING`, `COMPLETED`, `FAILED` | Current consequence state. |
| `consequenceError` | nullable text | Safe operator-facing failure text; never raw infrastructure details. |
| `consequenceUpdatedAt` | timestamp | Last consequence-state transition. |

Add a unique constraint on `ApprovalLog(instanceId, stepSequence)`. One
workflow step accepts one action. The application checks an existing action
before it relies on this constraint, so a retry is confirmed before a database
duplicate result can reject it.

The existing `ApprovalLog` data is not sufficient by itself. Add nullable,
unique `InventoryHistory.operationKey`. Approval consequence history uses
`<approvalLogId>:<unitId>` as its key. Existing non-approval history keeps this
field null. No separate repair table is needed.

The duplicate audit ran before this contract was accepted:

```sql
SELECT instance_id, step_sequence, COUNT(*)
FROM approval_logs
GROUP BY instance_id, step_sequence
HAVING COUNT(*) > 1;
```

Result: `0` duplicate groups. The unique constraint may be added without a
backfill decision. The database contained zero approval logs, zero approval
instances, and zero histories during the audit.

## Natural identity and idempotency

An approval action's natural identity is the approval instance, active step,
approver, and action: `instanceId + stepSequence + approverId + action`.
`ApprovalLog(instanceId, stepSequence)` is the database race guard.

Before pending-state validation, the application looks for an existing terminal
consequence log for the same instance, approver, and action. A completed log is
replayed without consequence calls. A pending or failed log resumes its
consequence. A different action occupying the active step returns the existing
not-pending error and performs no side effect.

The public action DTO gains no client-generated idempotency key and no new
endpoint. Intermediate approval does not call downstream capabilities, and its
local step transition prevents the same active step from being processed again.

## State transitions

- `NONE` consequence starts as `NOT_REQUIRED` and remains `NOT_REQUIRED`.
- Final approval and rejection start as `PENDING` in the approval-local
  transaction.
- A successful awaited consequence changes `PENDING` to `COMPLETED`.
- A failed awaited consequence changes `PENDING` to `FAILED` and returns a
  retryable result through the existing approval action route.
- A retry changes `FAILED` to `PENDING` before repeating awaited calls.
- `COMPLETED` is immutable; repeated requests return its stored result.

### PENDING consequence lease

The request that creates a final-approval or rejection log owns its initial
`PENDING` consequence and executes it directly. It does not claim the row again.
An existing `PENDING` log may be reclaimed only when its
`consequenceUpdatedAt` is older than the fixed five-minute
`CONSEQUENCE_LEASE_MS = 5 * 60 * 1000` lease. Reclaim conditionally changes
`PENDING` to `PENDING` and refreshes `consequenceUpdatedAt`; a fresh `PENDING`
request returns the safe in-progress `InternalServerErrorException` without
downstream calls. A request that loses the conditional claim rereads state and
cannot return success while it remains `PENDING`.

The five-minute lease avoids a new table, endpoint, or client token. Its cost is
that an abandoned consequence can remain retry-blocked for up to five minutes,
and a consequence running longer than the lease can be retried; loan/unit
target writes and keyed history therefore remain idempotent.

The local transaction writes only `ApprovalLog` and `ApprovalInstance`. It never
accepts a circulation or asset Prisma client and never calls a downstream port.

## Consequence calls

Final approval calls, in order:

1. Update loan status to `LOAN_APPROVED`.
2. Read loan items.
3. Update all loan units to `LOANED`.
4. Record one history row per unit with operation key
   `<approvalLogId>:<unitId>`.

Rejection calls, in order:

1. Update loan status to `LOAN_REJECTED`.
2. Read loan items.
3. Update all loan units to `AVAILABLE`.
4. Record one history row per unit with operation key
   `<approvalLogId>:<unitId>`.

Each call is awaited. Loan status and unit status writes set the target value,
and history uses `operationKey`, so retry does not repeat a completed side
effect. No event emitter, queue, broker, compensation endpoint, or fire-and-
forget call is introduced.

## Failure and repair result

When a downstream call fails, the use case attempts to persist `FAILED` and a
safe `consequenceError`. It returns the existing result shape with these
append-only fields:

```ts
{
  success: false,
  action: 'REJECT' | 'APPROVE_FINAL',
  log,
  consequence: {
    type: 'REJECTION' | 'FINAL_APPROVAL',
    status: 'FAILED',
    error: string,
  },
  retryable: true,
}
```

The existing HTTP action route remains `200`; clients inspect `success` and
`consequence.status`. A later identical action retries or replays through that
same route. If failure-state persistence itself fails, the original exception
propagates and the log remains `PENDING`, which is still retryable.

Missing reference data is resolved before approval-local persistence, preserving
the current fail-before-write behavior. Local approval persistence errors roll
back the approval log and instance update.

## Scope guard

T083-T090 may add the approved schema migration and internal port changes. They
must not add endpoints, packages, events, tables, period fields, or unrelated
public response changes. Pending-role filtering stays in Prisma, and pending
loan details use one bounded repository projection rather than one query per
approval.
