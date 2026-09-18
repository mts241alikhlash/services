import { InternalServerErrorException } from '@nestjs/common'
import type { IAssetUnitMutationPort } from '../../../../asset/index.js'
import type {
  IHistoryCapabilityPort,
  ILoanCapabilityPort,
  ILoanItemCapabilityPort,
} from '../../../../circulation/index.js'
import type {
  IApprovalRepository,
  ApprovalConsequenceTransitionResult,
  ApprovalConsequenceType,
  ApprovalLogRepositoryOutput,
  ProcessApprovalResult,
} from '../../../domain/repositories/approval.repository.js'

const CONSEQUENCE_FAILURE_MESSAGE =
  'Approval consequence could not be completed. Retry this action.'

type ExecutableConsequenceType = Exclude<ApprovalConsequenceType, 'NONE'>

export interface ApprovalConsequenceDependencies {
  approvalRepository: IApprovalRepository
  loanCapability: ILoanCapabilityPort
  loanItemCapability: ILoanItemCapabilityPort
  unitMutation: IAssetUnitMutationPort
  history: IHistoryCapabilityPort
}

type ApprovalStateDependencies = Pick<
  ApprovalConsequenceDependencies,
  'approvalRepository'
>

export interface ApprovalConsequenceInput {
  instanceId: string
  referenceId: string
  userId: string
  persistedNote: string | null | undefined
  pendingStatusId: string
  targetStatusId: string
  newStatusId: string
  transactionTypeId: string
  consequenceType: ExecutableConsequenceType
  log: ApprovalLogRepositoryOutput
}

export function actionForConsequence(
  consequenceType: ApprovalConsequenceType,
): ProcessApprovalResult['action'] {
  if (consequenceType === 'REJECTION') return 'REJECT'
  if (consequenceType === 'FINAL_APPROVAL') return 'APPROVE_FINAL'
  return 'APPROVE_STEP'
}

export function resultForLog(
  log: ApprovalLogRepositoryOutput,
): ProcessApprovalResult {
  const consequenceError =
    log.consequenceStatus === 'FAILED'
      ? (log.consequenceError ?? CONSEQUENCE_FAILURE_MESSAGE)
      : log.consequenceError

  return {
    success:
      log.consequenceStatus === 'COMPLETED' ||
      log.consequenceStatus === 'NOT_REQUIRED',
    action: actionForConsequence(log.consequenceType),
    log,
    consequence: {
      type: log.consequenceType,
      status: log.consequenceStatus,
      ...(consequenceError ? { error: consequenceError } : {}),
    },
    retryable:
      log.consequenceStatus === 'FAILED' || log.consequenceStatus === 'PENDING',
  }
}

export function missingConsequenceLog(): never {
  throw new InternalServerErrorException(
    'Approval consequence log could not be loaded.',
  )
}

export async function resultAfterLostConsequenceClaim(
  dependencies: ApprovalStateDependencies,
  instanceId: string,
  transition: ApprovalConsequenceTransitionResult,
  pendingFailure?: unknown,
): Promise<ProcessApprovalResult> {
  const transitionLog = transition.log
  if (!transitionLog) missingConsequenceLog()
  if (transitionLog.consequenceStatus !== 'PENDING') {
    return resultForLog(transitionLog)
  }

  const instance =
    await dependencies.approvalRepository.findInstanceById(instanceId)
  const log = instance?.logs?.find(
    (candidate) => candidate.id === transitionLog.id,
  )
  if (!log) missingConsequenceLog()
  if (log.consequenceStatus === 'PENDING') {
    if (pendingFailure !== undefined) throw pendingFailure as Error
    throw new InternalServerErrorException(
      'Approval consequence is already being processed. Retry this action.',
    )
  }
  return resultForLog(log)
}

export async function executeApprovalConsequence(
  dependencies: ApprovalConsequenceDependencies,
  input: ApprovalConsequenceInput,
): Promise<ProcessApprovalResult> {
  try {
    const loan = await dependencies.loanCapability.updateStatus(
      input.referenceId,
      input.targetStatusId,
    )
    const loanItems = await dependencies.loanItemCapability.findByLoanId(
      input.referenceId,
    )
    if (loanItems.length > 0) {
      await dependencies.unitMutation.updateStatuses({
        unitIds: loanItems.map((item) => item.unitId),
        statusId: input.newStatusId,
      })
      for (const item of loanItems) {
        await dependencies.history.record({
          unitId: item.unitId,
          transactionTypeId: input.transactionTypeId,
          previousStatusId: input.pendingStatusId,
          newStatusId: input.newStatusId,
          note:
            input.consequenceType === 'REJECTION'
              ? `Peminjaman ditolak (${input.persistedNote ?? 'Tanpa catatan'})`
              : `Peminjaman disetujui penuh oleh Kepala Sekolah (No. Peminjaman: ${loan.loanNumber})`,
          changedById: input.userId,
          operationKey: `${input.log.id}:${item.unitId}`,
        })
      }
    }
  } catch (error) {
    try {
      const failedLog =
        await dependencies.approvalRepository.transitionLogConsequence(
          input.log.id,
          'PENDING',
          'FAILED',
          CONSEQUENCE_FAILURE_MESSAGE,
          input.log.consequenceUpdatedAt,
        )
      if (!failedLog.log) throw error
      if (failedLog.transitioned) return resultForLog(failedLog.log)
      return resultAfterLostConsequenceClaim(
        dependencies,
        input.instanceId,
        failedLog,
        error,
      )
    } catch {
      throw error
    }
  }

  const completedLog =
    await dependencies.approvalRepository.transitionLogConsequence(
      input.log.id,
      'PENDING',
      'COMPLETED',
      null,
      input.log.consequenceUpdatedAt,
    )
  if (!completedLog.log) missingConsequenceLog()
  if (!completedLog.transitioned) {
    return resultAfterLostConsequenceClaim(
      dependencies,
      input.instanceId,
      completedLog,
    )
  }
  return resultForLog(completedLog.log)
}
