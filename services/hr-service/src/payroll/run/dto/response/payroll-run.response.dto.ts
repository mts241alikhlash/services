import { ApiProperty } from '@nestjs/swagger'
import {
  PayrollRunKind,
  PayrollRunStatus,
} from '../../../../generated/prisma/client.js'
import type {
  PayrollActorRef,
  PayrollRunWithTotals,
} from '../../domain/entities/payroll-run.entity.js'
import type { RecalculatedRun } from '../../use-cases/recalculate-payroll-run.use-case.js'

export class PayrollActorResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ type: String, nullable: true }) displayName!: string | null
}

export class PayrollRunTotalsResponseDto {
  @ApiProperty({ example: 42 }) employeeCount!: number
  @ApiProperty({ example: '153300000' }) gross!: string
  @ApiProperty({ example: '6300000' }) deductions!: string
  @ApiProperty({ example: '147000000' }) net!: string
}

function toActor(actor: PayrollActorRef): PayrollActorResponseDto {
  return { id: actor.id, displayName: actor.displayName }
}

export class PayrollRunResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ example: 2026 }) year!: number
  @ApiProperty({ example: 9 }) month!: number
  @ApiProperty({ enum: PayrollRunKind }) kind!: `${PayrollRunKind}`
  @ApiProperty({ example: 1 }) sequence!: number
  @ApiProperty({ enum: PayrollRunStatus }) status!: `${PayrollRunStatus}`
  @ApiProperty() roundingRule!: string
  @ApiProperty({ type: String, nullable: true }) note!: string | null
  @ApiProperty({ type: String, nullable: true }) submittedAt!: string | null
  @ApiProperty({ type: String, nullable: true }) approvedAt!: string | null
  @ApiProperty() createdAt!: string
  @ApiProperty({ type: () => PayrollRunTotalsResponseDto })
  totals!: PayrollRunTotalsResponseDto
  @ApiProperty({ type: () => PayrollActorResponseDto })
  createdBy!: PayrollActorResponseDto
  @ApiProperty({ type: () => PayrollActorResponseDto, nullable: true })
  submittedBy!: PayrollActorResponseDto | null
  @ApiProperty({ type: () => PayrollActorResponseDto, nullable: true })
  approvedBy!: PayrollActorResponseDto | null

  static fromDomain(run: PayrollRunWithTotals): PayrollRunResponseDto {
    const dto = new PayrollRunResponseDto()
    dto.id = run.id
    dto.year = run.year
    dto.month = run.month
    dto.kind = run.kind
    dto.sequence = run.sequence
    dto.status = run.status
    dto.roundingRule = run.roundingRule
    dto.note = run.note
    dto.submittedAt = run.submittedAt?.toISOString() ?? null
    dto.approvedAt = run.approvedAt?.toISOString() ?? null
    dto.createdAt = run.createdAt.toISOString()
    dto.totals = {
      employeeCount: run.totals.employeeCount,
      gross: run.totals.gross,
      deductions: run.totals.deductions,
      net: run.totals.net,
    }
    dto.createdBy = toActor(run.createdBy)
    dto.submittedBy = run.submittedBy ? toActor(run.submittedBy) : null
    dto.approvedBy = run.approvedBy ? toActor(run.approvedBy) : null
    return dto
  }
}

export class PayslipNetChangeResponseDto {
  @ApiProperty({ format: 'uuid' }) userId!: string
  @ApiProperty({ type: String, nullable: true }) displayName!: string | null
  @ApiProperty({ example: '3500000' }) previousNet!: string
  @ApiProperty({ example: '3650000' }) currentNet!: string
}

export class PreviousDraftResponseDto {
  @ApiProperty({ example: '147000000' }) net!: string
  @ApiProperty({ type: () => [PayslipNetChangeResponseDto] })
  changedPayslips!: PayslipNetChangeResponseDto[]
}

export class RecalculatedPayrollRunResponseDto extends PayrollRunResponseDto {
  @ApiProperty({ type: () => PreviousDraftResponseDto })
  previousDraft!: PreviousDraftResponseDto

  static fromRecalculated(
    run: RecalculatedRun,
  ): RecalculatedPayrollRunResponseDto {
    const dto = Object.assign(
      new RecalculatedPayrollRunResponseDto(),
      PayrollRunResponseDto.fromDomain(run),
    )
    dto.previousDraft = {
      net: run.previousDraft.net,
      changedPayslips: run.previousDraft.changedPayslips.map((change) => ({
        userId: change.userId,
        displayName: change.displayName,
        previousNet: change.previousNet,
        currentNet: change.currentNet,
      })),
    }
    return dto
  }
}
