import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import {
  PayrollRunEntity,
  PayrollRunKindEnum,
  PayrollRunWithTotals,
} from '../../domain/entities/payroll-run.entity.js'
import { ComposedPayslip } from '../../domain/entities/payslip.entity.js'
import {
  CreatePayrollRunInput,
  IPayrollRunRepository,
  PayrollRunQueryInput,
  PayslipNetSnapshot,
  RunStatusTransitionInput,
} from '../../domain/interfaces/payroll-run-repository.interface.js'
import {
  actorIds,
  buildRunWhere,
  RUN_INCLUDE,
  RunRow,
  rupiah,
  toRunWithTotals,
} from './payroll-run.where.js'
import { clearPayslips, writePayslips } from './payroll-run.writer.js'

@Injectable()
export class PrismaPayrollRunRepository implements IPayrollRunRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {}

  private async toDetailsList(rows: RunRow[]): Promise<PayrollRunWithTotals[]> {
    const profiles = await this.profileLookupPort.findByUserIds(actorIds(rows))
    const byUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    )

    return rows.map((row) => toRunWithTotals(row, byUserId))
  }

  private async toDetailsOne(row: RunRow): Promise<PayrollRunWithTotals> {
    const [details] = await this.toDetailsList([row])
    return details
  }

  async findAll(query: PayrollRunQueryInput): Promise<PayrollRunWithTotals[]> {
    const rows = await this.prisma.payrollRun.findMany({
      where: buildRunWhere(query),
      include: RUN_INCLUDE,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { sequence: 'desc' }],
    })

    return this.toDetailsList(rows)
  }

  async findById(id: string): Promise<PayrollRunWithTotals | null> {
    const row = await this.prisma.payrollRun.findFirst({
      where: { id, deletedAt: null },
      include: RUN_INCLUDE,
    })

    return row ? this.toDetailsOne(row) : null
  }

  async findRunById(id: string): Promise<PayrollRunEntity | null> {
    return this.prisma.payrollRun.findFirst({ where: { id, deletedAt: null } })
  }

  async findByPeriod(
    year: number,
    month: number,
    kind: PayrollRunKindEnum,
  ): Promise<PayrollRunEntity | null> {
    return this.prisma.payrollRun.findFirst({
      where: { year, month, kind, deletedAt: null },
      orderBy: { sequence: 'desc' },
    })
  }

  async nextSequence(
    year: number,
    month: number,
    kind: PayrollRunKindEnum,
  ): Promise<number> {
    const latest = await this.prisma.payrollRun.findFirst({
      where: { year, month, kind },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    })

    return (latest?.sequence ?? 0) + 1
  }

  async create(input: CreatePayrollRunInput): Promise<PayrollRunWithTotals> {
    const row = await this.prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          year: input.year,
          month: input.month,
          kind: input.kind,
          sequence: input.sequence,
          note: input.note ?? null,
          createdBy: input.createdBy,
        },
        select: { id: true },
      })

      await writePayslips(tx, run.id, input.payslips)

      return tx.payrollRun.findUniqueOrThrow({
        where: { id: run.id },
        include: RUN_INCLUDE,
      })
    })

    return this.toDetailsOne(row)
  }

  async snapshotNets(runId: string): Promise<PayslipNetSnapshot[]> {
    const rows = await this.prisma.payslip.findMany({
      where: { payrollRunId: runId, deletedAt: null },
      select: { userId: true, netAmount: true },
    })

    const profiles = await this.profileLookupPort.findByUserIds(
      rows.map((row) => row.userId),
    )
    const nameByUserId = new Map(profiles.map((p) => [p.userId, p.name]))

    return rows.map((row) => ({
      userId: row.userId,
      displayName: nameByUserId.get(row.userId) ?? null,
      net: rupiah(row.netAmount),
    }))
  }

  async replacePayslips(
    runId: string,
    payslips: ComposedPayslip[],
  ): Promise<PayrollRunWithTotals> {
    const row = await this.prisma.$transaction(async (tx) => {
      await clearPayslips(tx, runId)
      await writePayslips(tx, runId, payslips)

      return tx.payrollRun.findUniqueOrThrow({
        where: { id: runId },
        include: RUN_INCLUDE,
      })
    })

    return this.toDetailsOne(row)
  }

  async transition(
    id: string,
    input: RunStatusTransitionInput,
  ): Promise<PayrollRunWithTotals> {
    const stamp =
      input.status === 'APPROVED'
        ? { approvedBy: input.actorId, approvedAt: input.at }
        : { submittedBy: input.actorId, submittedAt: input.at }

    const row = await this.prisma.payrollRun.update({
      where: { id },
      data: { status: input.status, ...stamp },
      include: RUN_INCLUDE,
    })

    return this.toDetailsOne(row)
  }
}
