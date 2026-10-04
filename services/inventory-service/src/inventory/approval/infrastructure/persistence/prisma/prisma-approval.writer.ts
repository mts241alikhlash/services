import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  ProcessApprovalLocalTransactionInput,
  ProcessApprovalResult,
} from '../../../domain/repositories/approval.repository.js'
import { mapLog } from './prisma-approval.queries.js'

export async function processApprovalTransaction(
  prisma: PrismaService,
  params: ProcessApprovalLocalTransactionInput,
): Promise<ProcessApprovalResult> {
  const ACTION_APPROVE = '00000000-0000-0000-0000-000000000001'
  const ACTION_REJECT = '00000000-0000-0000-0000-000000000002'

  return prisma.$transaction(async (tx) => {
    const log = await tx.approvalLog.create({
      data: {
        instanceId: params.instanceId,
        stepSequence: params.currentStepSequence,
        approverId: params.userId,
        actionId: params.action === 'APPROVE' ? ACTION_APPROVE : ACTION_REJECT,
        note: params.note ?? null,
        consequenceType: params.consequenceType,
        consequenceStatus:
          params.consequenceType === 'NONE' ? 'NOT_REQUIRED' : 'PENDING',
        consequenceError: null,
      },
    })

    if (params.action === 'REJECT') {
      await tx.approvalInstance.update({
        where: { id: params.instanceId },
        data: { statusId: params.statusId },
      })

      return {
        success: true,
        action: 'REJECT',
        log: mapLog(log),
        consequence: {
          type: params.consequenceType,
          status: 'PENDING',
        },
        retryable: false,
      }
    }

    if (params.hasNextStep && params.nextStepSequence !== undefined) {
      await tx.approvalInstance.update({
        where: { id: params.instanceId },
        data: { currentStepSequence: params.nextStepSequence },
      })

      return {
        success: true,
        action: 'APPROVE_STEP',
        nextStepSequence: params.nextStepSequence,
        log: mapLog(log),
        consequence: {
          type: 'NONE',
          status: 'NOT_REQUIRED',
        },
        retryable: false,
      }
    }

    await tx.approvalInstance.update({
      where: { id: params.instanceId },
      data: { statusId: params.statusId },
    })

    return {
      success: true,
      action: 'APPROVE_FINAL',
      log: mapLog(log),
      consequence: {
        type: params.consequenceType,
        status: 'PENDING',
      },
      retryable: false,
    }
  })
}
