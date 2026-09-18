import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  IProfileLookupPort,
  ProfileSummary,
} from '../../../../platform/profile-lookup/profile-lookup.port.js'
import {
  PayslipDetail,
  PayslipSummary,
} from '../../domain/entities/payslip-detail.entity.js'
import {
  IPayslipRepository,
  MyPayslipQueryInput,
} from '../../domain/interfaces/payslip-repository.interface.js'

const DETAIL_INCLUDE = {
  payrollRun: {
    select: { id: true, year: true, month: true, kind: true, status: true },
  },
  lines: { orderBy: { componentType: 'asc' } },
} satisfies Prisma.PayslipInclude

type DetailRow = Prisma.PayslipGetPayload<{ include: typeof DETAIL_INCLUDE }>

function rupiah(value: Prisma.Decimal): string {
  return value.toFixed(0)
}

function employee(userId: string, profile: ProfileSummary | undefined) {
  return {
    userId,
    displayName: profile?.name ?? null,
    identifier: profile?.identifier ?? '',
  }
}

function toDetail(
  row: DetailRow,
  profile: ProfileSummary | undefined,
): PayslipDetail {
  return {
    id: row.id,
    run: row.payrollRun,
    employee: employee(row.userId, profile),
    attendance: {
      presentDays: row.presentDays,
      absentDays: row.absentDays,
      lateCount: row.lateCount,
      lateMinutes: row.lateMinutes,
      earlyLeaveCount: row.earlyLeaveCount,
      leaveDays: row.leaveDays,
      officialDutyDays: row.officialDutyDays,
    },
    lines: row.lines.map((line) => ({
      componentCode: line.componentCode,
      componentName: line.componentName,
      componentType: line.componentType,
      amount: rupiah(line.amount),
      driver: line.driver,
      driverCount: line.driverCount,
      rate: line.rate === null ? null : rupiah(line.rate),
    })),
    gross: rupiah(row.grossAmount),
    deductions: rupiah(row.deductionAmount),
    net: rupiah(row.netAmount),
  }
}

@Injectable()
export class PrismaPayslipRepository implements IPayslipRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {}

  async findByRun(runId: string): Promise<PayslipSummary[]> {
    const rows = await this.prisma.payslip.findMany({
      where: { payrollRunId: runId, deletedAt: null },
    })

    const profiles = await this.profileLookupPort.findByUserIds(
      rows.map((row) => row.userId),
    )
    const byUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    )

    return rows
      .map((row) => ({
        id: row.id,
        employee: employee(row.userId, byUserId.get(row.userId)),
        gross: rupiah(row.grossAmount),
        deductions: rupiah(row.deductionAmount),
        net: rupiah(row.netAmount),
      }))
      .sort((a, b) =>
        (a.employee.displayName ?? '').localeCompare(
          b.employee.displayName ?? '',
        ),
      )
  }

  async findById(id: string): Promise<PayslipDetail | null> {
    const row = await this.prisma.payslip.findFirst({
      where: { id, deletedAt: null },
      include: DETAIL_INCLUDE,
    })
    if (!row) return null

    const [profile] = await this.profileLookupPort.findByUserIds([row.userId])
    return toDetail(row, profile)
  }

  async findOwn(
    userId: string,
    query: MyPayslipQueryInput,
  ): Promise<PayslipDetail | null> {
    const row = await this.prisma.payslip.findFirst({
      where: {
        userId,
        deletedAt: null,
        payrollRun: {
          deletedAt: null,
          status: 'APPROVED',
          ...(query.year !== undefined && { year: query.year }),
          ...(query.month !== undefined && { month: query.month }),
        },
      },
      include: DETAIL_INCLUDE,
      orderBy: [
        { payrollRun: { year: 'desc' } },
        { payrollRun: { month: 'desc' } },
        { payrollRun: { sequence: 'desc' } },
      ],
    })
    if (!row) return null

    const [profile] = await this.profileLookupPort.findByUserIds([row.userId])
    return toDetail(row, profile)
  }

  async findOwnerId(id: string): Promise<string | null> {
    const row = await this.prisma.payslip.findFirst({
      where: { id, deletedAt: null },
      select: { userId: true },
    })

    return row?.userId ?? null
  }
}
