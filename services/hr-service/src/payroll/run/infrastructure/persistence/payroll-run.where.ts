import { Prisma } from '@prisma/client'
import { ProfileSummary } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import {
  PayrollActorRef,
  PayrollRunWithTotals,
} from '../../domain/entities/payroll-run.entity.js'
import { PayrollRunQueryInput } from '../../domain/interfaces/payroll-run-repository.interface.js'

export function buildRunWhere(
  query: PayrollRunQueryInput,
): Prisma.PayrollRunWhereInput {
  return {
    deletedAt: null,
    ...(query.year !== undefined && { year: query.year }),
    ...(query.status && { status: query.status }),
  }
}

export const RUN_INCLUDE = {
  payslips: {
    where: { deletedAt: null },
    select: { grossAmount: true, deductionAmount: true, netAmount: true },
  },
} satisfies Prisma.PayrollRunInclude

export type RunRow = Prisma.PayrollRunGetPayload<{
  include: typeof RUN_INCLUDE
}>

export function rupiah(value: Prisma.Decimal | number): string {
  return typeof value === 'number'
    ? String(Math.round(value))
    : value.toFixed(0)
}

export function actorIds(rows: RunRow[]): string[] {
  return rows.flatMap((row) =>
    [row.createdBy, row.submittedBy, row.approvedBy].filter(
      (id): id is string => id !== null,
    ),
  )
}

function actor(
  userId: string | null,
  profileByUserId: Map<string, ProfileSummary>,
): PayrollActorRef | null {
  return userId
    ? { id: userId, displayName: profileByUserId.get(userId)?.name ?? null }
    : null
}

export function toRunWithTotals(
  row: RunRow,
  profileByUserId: Map<string, ProfileSummary>,
): PayrollRunWithTotals {
  let gross = 0
  let deductions = 0
  let net = 0

  for (const payslip of row.payslips) {
    gross += payslip.grossAmount.toNumber()
    deductions += payslip.deductionAmount.toNumber()
    net += payslip.netAmount.toNumber()
  }

  return {
    id: row.id,
    year: row.year,
    month: row.month,
    kind: row.kind,
    sequence: row.sequence,
    status: row.status,
    roundingRule: row.roundingRule,
    note: row.note,
    submittedAt: row.submittedAt,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
    totals: {
      employeeCount: row.payslips.length,
      gross: rupiah(gross),
      deductions: rupiah(deductions),
      net: rupiah(net),
    },
    createdBy: actor(row.createdBy, profileByUserId) ?? {
      id: row.createdBy,
      displayName: null,
    },
    submittedBy: actor(row.submittedBy, profileByUserId),
    approvedBy: actor(row.approvedBy, profileByUserId),
  }
}
