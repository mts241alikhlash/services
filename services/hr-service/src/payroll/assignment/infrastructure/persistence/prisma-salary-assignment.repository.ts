import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import {
  EffectiveAssignment,
  SalaryAssignmentEntity,
  SalaryAssignmentWithComponent,
} from '../../domain/entities/salary-assignment.entity.js'
import {
  CreateSalaryAssignmentInput,
  ISalaryAssignmentRepository,
} from '../../domain/interfaces/salary-assignment-repository.interface.js'

const ASSIGNMENT_INCLUDE = {
  component: {
    select: { id: true, code: true, name: true, type: true, driver: true },
  },
} satisfies Prisma.SalaryAssignmentInclude

type Row = Prisma.SalaryAssignmentGetPayload<{
  include: typeof ASSIGNMENT_INCLUDE
}>

function money(value: Prisma.Decimal | null): string | null {
  return value === null ? null : value.toFixed(2)
}

@Injectable()
export class PrismaSalaryAssignmentRepository implements ISalaryAssignmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {}

  private async toDetailsList(
    rows: Row[],
  ): Promise<SalaryAssignmentWithComponent[]> {
    const profiles = await this.profileLookupPort.findByUserIds(
      rows.map((row) => row.userId),
    )
    const byUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    )

    return rows.map((row) => {
      const { component, amount, rate, ...assignment } = row
      return {
        ...assignment,
        amount: money(amount),
        rate: money(rate),
        component,
        holder: {
          id: row.userId,
          displayName: byUserId.get(row.userId)?.name ?? null,
        },
      }
    })
  }

  private async toDetailsOne(row: Row): Promise<SalaryAssignmentWithComponent> {
    const [details] = await this.toDetailsList([row])
    return details
  }

  async findAll(userId?: string): Promise<SalaryAssignmentWithComponent[]> {
    const rows = await this.prisma.salaryAssignment.findMany({
      where: { deletedAt: null, ...(userId && { userId }) },
      include: ASSIGNMENT_INCLUDE,
      orderBy: [{ userId: 'asc' }, { effectiveFrom: 'desc' }],
    })

    return this.toDetailsList(rows)
  }

  async findById(id: string): Promise<SalaryAssignmentEntity | null> {
    const row = await this.prisma.salaryAssignment.findFirst({
      where: { id, deletedAt: null },
      include: ASSIGNMENT_INCLUDE,
    })

    return row ? this.toDetailsOne(row) : null
  }

  async findEffectiveOn(
    userIds: string[],
    date: Date,
  ): Promise<EffectiveAssignment[]> {
    if (userIds.length === 0) return []

    const rows = await this.prisma.salaryAssignment.findMany({
      where: {
        userId: { in: userIds },
        deletedAt: null,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
        component: { deletedAt: null },
      },
      include: ASSIGNMENT_INCLUDE,
      orderBy: { effectiveFrom: 'desc' },
    })

    const seen = new Set<string>()
    const effective: EffectiveAssignment[] = []

    for (const row of rows) {
      const key = `${row.userId}:${row.componentId}`
      if (seen.has(key)) continue
      seen.add(key)

      effective.push({
        userId: row.userId,
        componentId: row.componentId,
        componentCode: row.component.code,
        componentName: row.component.name,
        componentType: row.component.type,
        driver: row.component.driver,
        amount: money(row.amount),
        rate: money(row.rate),
        effectiveFrom: row.effectiveFrom,
      })
    }

    return effective
  }

  async create(
    input: CreateSalaryAssignmentInput,
  ): Promise<SalaryAssignmentWithComponent> {
    const { userId, componentId, effectiveFrom } = input
    const dayBefore = new Date(effectiveFrom)
    dayBefore.setUTCDate(dayBefore.getUTCDate() - 1)

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.salaryAssignment.updateMany({
        where: {
          userId,
          componentId,
          deletedAt: null,
          effectiveTo: null,
          effectiveFrom: { lt: effectiveFrom },
        },
        data: { effectiveTo: dayBefore },
      })

      return tx.salaryAssignment.create({
        data: {
          userId,
          componentId,
          amount: input.amount ?? null,
          rate: input.rate ?? null,
          effectiveFrom,
          createdBy: input.createdBy,
        },
        include: ASSIGNMENT_INCLUDE,
      })
    })

    return this.toDetailsOne(row)
  }

  async softDelete(id: string): Promise<SalaryAssignmentEntity> {
    const row = await this.prisma.salaryAssignment.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: ASSIGNMENT_INCLUDE,
    })

    return this.toDetailsOne(row)
  }
}
