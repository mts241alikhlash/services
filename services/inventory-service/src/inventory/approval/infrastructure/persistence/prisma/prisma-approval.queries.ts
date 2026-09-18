import type {
  ApprovalInstance,
  ApprovalLog,
  ApprovalStep,
  ApprovalWorkflow,
} from '@prisma/client'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  ApprovalInstanceRepositoryOutput,
  ApprovalLogRepositoryOutput,
  ApprovalWorkflowRepositoryOutput,
} from '../../../domain/repositories/approval.repository.js'
import { PENDING_APPROVAL_INSTANCE_WITH_RELATIONS_INCLUDE } from './prisma-approval.includes.js'

function mapWorkflowStep(step: ApprovalStep) {
  return {
    id: step.id,
    workflowId: step.workflowId,
    stepSequence: step.stepSequence,
    approverRoleCode: step.approverRoleCode,
    isMandatory: step.isMandatory,
    createdAt: step.createdAt,
  }
}

export function mapWorkflow(
  workflow: ApprovalWorkflow & { steps?: ApprovalStep[] },
): ApprovalWorkflowRepositoryOutput {
  return {
    id: workflow.id,
    name: workflow.name,
    targetEntity: workflow.targetEntity,
    description: workflow.description,
    isActive: workflow.isActive,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
    ...(workflow.steps && { steps: workflow.steps.map(mapWorkflowStep) }),
  }
}

export function mapLog(log: ApprovalLog): ApprovalLogRepositoryOutput {
  return {
    id: log.id,
    instanceId: log.instanceId,
    stepSequence: log.stepSequence,
    approverId: log.approverId,
    actionId: log.actionId,
    note: log.note,
    createdAt: log.createdAt,
    consequenceType: log.consequenceType,
    consequenceStatus: log.consequenceStatus,
    consequenceError: log.consequenceError,
    consequenceUpdatedAt: log.consequenceUpdatedAt,
  }
}

export function mapInstance(
  instance: ApprovalInstance & {
    workflow?: (ApprovalWorkflow & { steps?: ApprovalStep[] }) | null
    logs?: ApprovalLog[]
  },
): ApprovalInstanceRepositoryOutput {
  return {
    id: instance.id,
    workflowId: instance.workflowId,
    referenceId: instance.referenceId,
    statusId: instance.statusId,
    currentStepSequence: instance.currentStepSequence,
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
    ...(instance.workflow !== undefined && {
      workflow: instance.workflow && mapWorkflow(instance.workflow),
    }),
    ...(instance.logs && { logs: instance.logs.map(mapLog) }),
  }
}

export async function findPendingInstancesForRoles(
  prisma: PrismaService,
  roleCodes: string[],
  pendingStatusId: string,
): Promise<ApprovalInstanceRepositoryOutput[]> {
  if (roleCodes.length === 0) return []

  const matchingSteps = await prisma.approvalStep.findMany({
    where: { approverRoleCode: { in: roleCodes } },
    select: { workflowId: true, stepSequence: true },
  })
  if (matchingSteps.length === 0) return []

  const instances = await prisma.approvalInstance.findMany({
    where: {
      statusId: pendingStatusId,
      OR: matchingSteps.map(({ workflowId, stepSequence }) => ({
        workflowId,
        currentStepSequence: stepSequence,
      })),
    },
    include: PENDING_APPROVAL_INSTANCE_WITH_RELATIONS_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })

  return instances.map(mapInstance)
}
