import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { WorkPatternAssignmentWithDetails } from '../../domain/entities/work-pattern.entity.js'
import { AssignWorkPatternInput } from '../../domain/interfaces/work-pattern-repository.interface.js'

export const ASSIGNMENT_INCLUDE = {
  workPattern: { select: { name: true } },
} satisfies Prisma.WorkPatternAssignmentInclude

type AssignmentRow = Prisma.WorkPatternAssignmentGetPayload<{
  include: typeof ASSIGNMENT_INCLUDE
}>

async function toDetailsList(
  rows: AssignmentRow[],
  profileLookupPort: IProfileLookupPort,
): Promise<WorkPatternAssignmentWithDetails[]> {
  const profiles = await profileLookupPort.findByUserIds(
    rows.map((row) => row.userId),
  )
  const byUserId = new Map(profiles.map((profile) => [profile.userId, profile]))

  return rows.map((row) => {
    const { workPattern, ...assignment } = row
    const profile = byUserId.get(row.userId)
    return {
      ...assignment,
      patternName: workPattern.name,
      holder: {
        id: row.userId,
        identifier: profile?.identifier ?? '',
        displayName: profile?.name ?? null,
      },
    }
  })
}

export async function findAssignments(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  userId?: string,
): Promise<WorkPatternAssignmentWithDetails[]> {
  const rows = await prisma.workPatternAssignment.findMany({
    where: { deletedAt: null, ...(userId && { userId }) },
    include: ASSIGNMENT_INCLUDE,
    orderBy: { effectiveFrom: 'desc' },
  })

  return toDetailsList(rows, profileLookupPort)
}

export async function assign(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  input: AssignWorkPatternInput,
): Promise<WorkPatternAssignmentWithDetails> {
  const { userId, workPatternId, effectiveFrom } = input
  const dayBefore = new Date(effectiveFrom)
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1)

  const row = await prisma.$transaction(async (tx) => {
    await tx.workPatternAssignment.updateMany({
      where: {
        userId,
        deletedAt: null,
        effectiveTo: null,
        effectiveFrom: { lt: effectiveFrom },
      },
      data: { effectiveTo: dayBefore },
    })

    return tx.workPatternAssignment.create({
      data: { userId, workPatternId, effectiveFrom },
      include: ASSIGNMENT_INCLUDE,
    })
  })

  const [details] = await toDetailsList([row], profileLookupPort)
  return details
}

export async function removeAssignment(
  prisma: PrismaService,
  id: string,
): Promise<void> {
  await prisma.workPatternAssignment.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
