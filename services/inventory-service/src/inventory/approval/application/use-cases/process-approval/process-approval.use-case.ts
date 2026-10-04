import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IAssetUnitMutationPort } from '../../../../asset/index.js'
import {
  IHistoryCapabilityPort,
  ILoanCapabilityPort,
  ILoanItemCapabilityPort,
  ITransactionTypeCapabilityPort,
} from '../../../../circulation/index.js'
import { IStatusLookupPort } from '../../../../reference-data/status/index.js'
import { InventoryReferenceDataMissingException } from '../../../../shared/domain/exceptions/inventory-reference-data-missing.exception.js'
import {
  IApprovalRepository,
  type ApprovalConsequenceType,
  type ApprovalInstanceRepositoryOutput,
  type ProcessApprovalResult,
} from '../../../domain/repositories/approval.repository.js'
import { ProcessApprovalInput } from './process-approval.input.js'
import {
  actionForConsequence,
  executeApprovalConsequence,
  missingConsequenceLog,
  resultAfterLostConsequenceClaim,
  resultForLog,
} from './process-approval-consequence.js'

const APPROVE_ACTION_ID = '00000000-0000-0000-0000-000000000001'
const REJECT_ACTION_ID = '00000000-0000-0000-0000-000000000002'
const CONSEQUENCE_IN_PROGRESS_MESSAGE =
  'Approval consequence is already being processed. Retry this action.'
const CONSEQUENCE_LEASE_MS = 5 * 60 * 1000

function isConsequenceLeaseExpired(updatedAt: Date): boolean {
  return Date.now() - updatedAt.getTime() > CONSEQUENCE_LEASE_MS
}

function isApprovalStepUniqueRace(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  const candidate = error as {
    code?: unknown
    meta?: { target?: unknown }
  }
  if (candidate.code !== 'P2002') return false

  const target = candidate.meta?.target
  if (Array.isArray(target)) {
    const fields = target.map(String)
    return (
      fields.some(
        (field) => field === 'instance_id' || field === 'instanceId',
      ) &&
      fields.some(
        (field) => field === 'step_sequence' || field === 'stepSequence',
      )
    )
  }

  return (
    typeof target === 'string' &&
    target.includes('instance') &&
    target.includes('step')
  )
}

@Injectable()
export class ProcessApprovalUseCase {
  constructor(
    private readonly approvalRepository: IApprovalRepository,
    private readonly statusLookup: IStatusLookupPort,
    private readonly loanCapability: ILoanCapabilityPort,
    private readonly loanItemCapability: ILoanItemCapabilityPort,
    private readonly unitMutation: IAssetUnitMutationPort,
    private readonly history: IHistoryCapabilityPort,
    private readonly transactionType: ITransactionTypeCapabilityPort,
  ) {}

  async execute(
    instanceId: string,
    input: ProcessApprovalInput,
    userId: string,
    roleCodes: string[],
  ): Promise<ProcessApprovalResult> {
    return this.executeInternal(instanceId, input, userId, roleCodes)
  }

  private async executeInternal(
    instanceId: string,
    input: ProcessApprovalInput,
    userId: string,
    roleCodes: string[],
    instanceOverride?: ApprovalInstanceRepositoryOutput,
    activeStepSequence?: number,
    recoverUniqueRace = true,
  ): Promise<ProcessApprovalResult> {
    const instance =
      instanceOverride ??
      (await this.approvalRepository.findInstanceById(instanceId))
    if (!instance) {
      throw new NotFoundException('Approval instance not found.')
    }

    const currentSeq = activeStepSequence ?? instance.currentStepSequence ?? 1
    const actionId =
      input.action === 'APPROVE' ? APPROVE_ACTION_ID : REJECT_ACTION_ID
    const activeStepLogs = (instance.logs ?? []).filter(
      (log) => log.stepSequence === currentSeq,
    )
    const existingLog = activeStepLogs.find(
      (log) => log.approverId === userId && log.actionId === actionId,
    )
    if (existingLog?.consequenceStatus === 'COMPLETED') {
      return resultForLog(existingLog)
    }
    if (existingLog?.consequenceStatus === 'NOT_REQUIRED') {
      return resultForLog(existingLog)
    }
    if (!existingLog && activeStepLogs.length > 0) {
      throw new BadRequestException(
        'This approval request is no longer pending.',
      )
    }

    const pendingStatus =
      await this.statusLookup.findBySystemKey('LOAN_PENDING')
    if (!pendingStatus) {
      throw new BadRequestException(
        'This approval request is no longer pending.',
      )
    }
    if (!existingLog && instance.statusId !== pendingStatus.id) {
      throw new BadRequestException(
        'This approval request is no longer pending.',
      )
    }

    const steps = instance.workflow?.steps ?? []
    const activeStep = steps.find((s) => s.stepSequence === currentSeq)
    if (!activeStep) {
      throw new BadRequestException(
        'Current approval step sequence is invalid.',
      )
    }

    const approverRoleCode = String(activeStep.approverRoleCode ?? '')
    if (!roleCodes.includes(approverRoleCode)) {
      throw new ForbiddenException(
        `You do not have the required role (${approverRoleCode}) to process this step.`,
      )
    }

    if (
      existingLog?.consequenceStatus === 'PENDING' &&
      !isConsequenceLeaseExpired(existingLog.consequenceUpdatedAt)
    ) {
      throw new InternalServerErrorException(CONSEQUENCE_IN_PROGRESS_MESSAGE)
    }

    const nextStep = steps.find((s) => s.stepSequence === currentSeq + 1)
    const resumingConsequence =
      existingLog !== undefined &&
      (existingLog.consequenceStatus === 'PENDING' ||
        existingLog.consequenceStatus === 'FAILED')

    if (!resumingConsequence && input.forwardToNextApprover && !nextStep) {
      throw new BadRequestException(
        'This workflow has no further approver to forward to.',
      )
    }

    const forwarding =
      !resumingConsequence &&
      input.action === 'APPROVE' &&
      !!nextStep &&
      (nextStep.isMandatory || input.forwardToNextApprover === true)
    const consequenceType: ApprovalConsequenceType = existingLog
      ? existingLog.consequenceType
      : forwarding
        ? 'NONE'
        : input.action === 'REJECT'
          ? 'REJECTION'
          : 'FINAL_APPROVAL'
    const persistedNote = existingLog ? (existingLog.note ?? null) : input.note

    let rejectedStatus: { id: string } | null = null
    let availableStatus: { id: string } | null = null
    let cancelType: { id: string } | null = null
    let approvedStatus: { id: string } | null = null
    let loanedStatus: { id: string } | null = null
    let loanOutType: { id: string } | null = null

    if (consequenceType === 'REJECTION') {
      rejectedStatus = await this.statusLookup.findBySystemKey('LOAN_REJECTED')
      availableStatus = await this.statusLookup.findBySystemKey('AVAILABLE')
      cancelType =
        await this.transactionType.findTransactionTypeByCode('TX-LOAN-CANCEL')
      const missing: string[] = []
      if (!rejectedStatus) missing.push('status role LOAN_REJECTED')
      if (!availableStatus) missing.push('status role AVAILABLE')
      if (!cancelType) missing.push('transaction type TX-LOAN-CANCEL')
      if (!rejectedStatus || !availableStatus || !cancelType) {
        throw new InventoryReferenceDataMissingException(missing)
      }
    }

    if (consequenceType === 'FINAL_APPROVAL') {
      approvedStatus = await this.statusLookup.findBySystemKey('LOAN_APPROVED')
      loanedStatus = await this.statusLookup.findBySystemKey('LOANED')
      loanOutType =
        await this.transactionType.findTransactionTypeByCode('TX-LOAN-OUT')
      const missing: string[] = []
      if (!approvedStatus) missing.push('status role LOAN_APPROVED')
      if (!loanedStatus) missing.push('status role LOANED')
      if (!loanOutType) missing.push('transaction type TX-LOAN-OUT')
      if (!approvedStatus || !loanedStatus || !loanOutType) {
        throw new InventoryReferenceDataMissingException(missing)
      }
    }

    let result: ProcessApprovalResult
    if (existingLog) {
      let log = existingLog
      if (
        existingLog.consequenceStatus === 'FAILED' ||
        (existingLog.consequenceStatus === 'PENDING' &&
          isConsequenceLeaseExpired(existingLog.consequenceUpdatedAt))
      ) {
        const pendingTransition =
          await this.approvalRepository.transitionLogConsequence(
            existingLog.id,
            existingLog.consequenceStatus,
            'PENDING',
            null,
            existingLog.consequenceUpdatedAt,
          )
        if (!pendingTransition.log) {
          missingConsequenceLog()
        }
        if (!pendingTransition.transitioned) {
          return resultAfterLostConsequenceClaim(
            { approvalRepository: this.approvalRepository },
            instanceId,
            pendingTransition,
          )
        }
        log = pendingTransition.log
      }
      result = {
        success: true,
        action: actionForConsequence(log.consequenceType),
        log,
        consequence: {
          type: log.consequenceType,
          status: log.consequenceStatus,
        },
        retryable: false,
      }
    } else {
      try {
        result = await this.approvalRepository.processApprovalTransaction({
          instanceId,
          currentStepSequence: currentSeq,
          action: input.action,
          userId,
          note: input.note,
          statusId:
            consequenceType === 'REJECTION'
              ? rejectedStatus?.id
              : approvedStatus?.id,
          hasNextStep: forwarding,
          nextStepSequence: forwarding ? nextStep?.stepSequence : undefined,
          consequenceType,
        })
      } catch (error) {
        if (!recoverUniqueRace || !isApprovalStepUniqueRace(error)) {
          throw error
        }

        let reloadedInstance: ApprovalInstanceRepositoryOutput | null
        try {
          reloadedInstance =
            await this.approvalRepository.findInstanceById(instanceId)
        } catch {
          throw error
        }
        if (!reloadedInstance) throw error

        const racedStepLogs = (reloadedInstance.logs ?? []).filter(
          (log) => log.stepSequence === currentSeq,
        )
        const racedLog = racedStepLogs.find(
          (log) => log.approverId === userId && log.actionId === actionId,
        )
        if (!racedLog) {
          if (racedStepLogs.length > 0) {
            throw new BadRequestException(
              'This approval request is no longer pending.',
            )
          }
          throw error
        }

        return this.executeInternal(
          instanceId,
          input,
          userId,
          roleCodes,
          reloadedInstance,
          currentSeq,
          false,
        )
      }
    }

    if (consequenceType === 'NONE') return result
    const targetStatus =
      consequenceType === 'REJECTION' ? rejectedStatus : approvedStatus
    const newStatus =
      consequenceType === 'REJECTION' ? availableStatus : loanedStatus
    const transactionType =
      consequenceType === 'REJECTION' ? cancelType : loanOutType

    return executeApprovalConsequence(
      {
        approvalRepository: this.approvalRepository,
        loanCapability: this.loanCapability,
        loanItemCapability: this.loanItemCapability,
        unitMutation: this.unitMutation,
        history: this.history,
      },
      {
        instanceId,
        referenceId: instance.referenceId,
        userId,
        persistedNote,
        pendingStatusId: pendingStatus.id,
        targetStatusId: targetStatus!.id,
        newStatusId: newStatus!.id,
        transactionTypeId: transactionType!.id,
        consequenceType,
        log: result.log,
      },
    )
  }
}
