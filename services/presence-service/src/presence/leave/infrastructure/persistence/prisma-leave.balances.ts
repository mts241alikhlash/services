import { PrismaService } from '../../../../core/database/prisma.service.js'
import { LeaveBalanceRow } from '../../domain/interfaces/leave-repository.interface.js'

export async function findBalances(
  prisma: PrismaService,
  userId: string,
  year: number,
): Promise<LeaveBalanceRow[]> {
  const types = await prisma.leaveType.findMany({
    where: { deletedAt: null, isActive: true, consumesQuota: true },
  })

  const overrides = await prisma.leaveBalance.findMany({
    where: { userId, year },
  })

  const rows: LeaveBalanceRow[] = []
  for (const type of types) {
    const override = overrides.find((row) => row.leaveTypeId === type.id)
    const quota = override?.quota ?? type.annualQuota ?? 0
    const used = await countUsedDays(prisma, userId, type.id, year)

    rows.push({
      leaveTypeId: type.id,
      code: type.code,
      name: type.name,
      year,
      quota,
      used,
      remaining: Math.max(0, quota - used),
    })
  }

  return rows
}

export async function countUsedDays(
  prisma: PrismaService,
  userId: string,
  leaveTypeId: string,
  year: number,
): Promise<number> {
  return prisma.leaveDay.count({
    where: {
      date: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
      },
      leaveRequest: {
        requesterId: userId,
        leaveTypeId,
        status: 'APPROVED',
        deletedAt: null,
      },
    },
  })
}
