import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  ApprovalConsequenceStatus,
  ApprovalConsequenceTransitionResult,
} from '../../../domain/repositories/approval.repository.js'
import { mapLog } from './prisma-approval.queries.js'

export async function transitionLogConsequence(
  prisma: PrismaService,
  logId: string,
  expectedStatus: ApprovalConsequenceStatus,
  nextStatus: ApprovalConsequenceStatus,
  safeError?: string | null,
  expectedUpdatedAt?: Date,
): Promise<ApprovalConsequenceTransitionResult> {
  return prisma.$transaction(async (tx) => {
    const currentLog =
      expectedStatus === 'COMPLETED'
        ? await tx.approvalLog.findUnique({ where: { id: logId } })
        : null
    if (currentLog) {
      return { log: mapLog(currentLog), transitioned: false }
    }

    const updatedLogs = await tx.approvalLog.updateManyAndReturn({
      where: {
        id: logId,
        consequenceStatus: expectedStatus,
        ...(expectedUpdatedAt && { consequenceUpdatedAt: expectedUpdatedAt }),
      },
      data: {
        consequenceStatus: nextStatus,
        consequenceError: safeError ?? null,
        consequenceUpdatedAt: new Date(),
      },
    })

    const log = updatedLogs[0]
    if (log) {
      return { log: mapLog(log), transitioned: true }
    }

    const storedLog = await tx.approvalLog.findUnique({
      where: { id: logId },
    })
    return {
      log: storedLog ? mapLog(storedLog) : null,
      transitioned: false,
    }
  })
}
