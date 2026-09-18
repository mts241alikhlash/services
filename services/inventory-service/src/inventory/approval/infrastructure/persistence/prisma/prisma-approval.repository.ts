import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import type { ApprovalLog } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  IApprovalRepository,
  IApprovalCapabilityPort,
  type ApprovalInstanceRepositoryOutput,
  type ApprovalWorkflowRepositoryOutput,
  type CreateApprovalLogInput,
  type CreateApprovalWorkflowInput,
  type ProcessApprovalResult,
  type ProcessApprovalLocalTransactionInput,
  type UpdateApprovalInstanceInput,
  type ApprovalInstanceCapabilityOutput,
  type ApprovalWorkflowCapabilityOutput,
  type CreateApprovalInstanceCapabilityInput,
} from '../../../domain/repositories/approval.repository.js'
import { processApprovalTransaction } from './prisma-approval.writer.js'
import { transitionLogConsequence } from './prisma-approval.transition.js'
import {
  APPROVAL_INSTANCE_WITH_RELATIONS_INCLUDE,
  WORKFLOW_WITH_STEPS_INCLUDE,
} from './prisma-approval.includes.js'
import {
  findPendingInstancesForRoles as queryPendingInstancesForRoles,
  mapInstance,
  mapLog,
  mapWorkflow,
} from './prisma-approval.queries.js'

@Injectable()
export class PrismaApprovalRepository
  extends IApprovalRepository
  implements IApprovalCapabilityPort
{
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAllWorkflows(): Promise<ApprovalWorkflowRepositoryOutput[]> {
    const workflows = await this.prisma.approvalWorkflow.findMany({
      include: WORKFLOW_WITH_STEPS_INCLUDE,
      orderBy: { name: 'asc' },
    })
    return workflows.map(mapWorkflow)
  }

  async findWorkflowById(
    id: string,
  ): Promise<ApprovalWorkflowRepositoryOutput | null> {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id },
      include: WORKFLOW_WITH_STEPS_INCLUDE,
    })
    return workflow ? mapWorkflow(workflow) : null
  }

  async createWorkflow(
    input: CreateApprovalWorkflowInput,
  ): Promise<ApprovalWorkflowRepositoryOutput> {
    const { steps, ...scalars } = input

    return this.prisma.$transaction(async (tx) => {
      if (scalars.isActive !== false) {
        await tx.approvalWorkflow.updateMany({
          where: { targetEntity: scalars.targetEntity, isActive: true },
          data: { isActive: false },
        })
      }

      const data: Prisma.ApprovalWorkflowCreateInput = {
        ...scalars,
        steps: {
          create: steps.map((step) => ({
            stepSequence: step.stepSequence,
            approverRoleCode: step.approverRoleCode,
            isMandatory: step.isMandatory ?? true,
          })),
        },
      }

      const workflow = await tx.approvalWorkflow.create({
        data,
        include: WORKFLOW_WITH_STEPS_INCLUDE,
      })
      return mapWorkflow(workflow)
    })
  }

  async findInstanceById(
    id: string,
  ): Promise<ApprovalInstanceRepositoryOutput | null> {
    const instance = await this.prisma.approvalInstance.findUnique({
      where: { id },
      include: APPROVAL_INSTANCE_WITH_RELATIONS_INCLUDE,
    })
    return instance ? mapInstance(instance) : null
  }

  async updateInstance(
    id: string,
    data: UpdateApprovalInstanceInput,
  ): Promise<ApprovalInstanceRepositoryOutput> {
    const instance = await this.prisma.approvalInstance.update({
      where: { id },
      data: {
        ...(data.statusId !== undefined && { statusId: data.statusId }),
        ...(data.currentStepSequence !== undefined && {
          currentStepSequence: data.currentStepSequence,
        }),
      },
    })
    return mapInstance(instance)
  }

  async createLog(data: CreateApprovalLogInput) {
    const log = await this.prisma.approvalLog.create({ data })
    return mapLog(log)
  }

  async findPendingInstancesForRoles(
    roleCodes: string[],
    pendingStatusId: string,
  ): Promise<ApprovalInstanceRepositoryOutput[]> {
    return queryPendingInstancesForRoles(
      this.prisma,
      roleCodes,
      pendingStatusId,
    )
  }

  async findActiveWorkflow(
    targetEntity: string,
  ): Promise<ApprovalWorkflowCapabilityOutput | null> {
    return this.prisma.approvalWorkflow.findFirst({
      where: { targetEntity, isActive: true },
      select: { id: true },
    })
  }

  async createInstance(
    input: CreateApprovalInstanceCapabilityInput,
  ): Promise<ApprovalInstanceCapabilityOutput> {
    return this.prisma.approvalInstance.create({
      data: {
        workflowId: input.workflowId,
        referenceId: input.referenceId,
        currentStepSequence: 1,
        statusId: input.statusId,
      },
      select: { id: true },
    })
  }

  async processApprovalTransaction(
    params: ProcessApprovalLocalTransactionInput,
  ): Promise<ProcessApprovalResult> {
    return processApprovalTransaction(this.prisma, params)
  }

  async transitionLogConsequence(
    logId: string,
    expectedStatus: ProcessApprovalResult['consequence']['status'],
    nextStatus: ProcessApprovalResult['consequence']['status'],
    safeError?: string | null,
    expectedUpdatedAt?: Date,
  ) {
    return transitionLogConsequence(
      this.prisma,
      logId,
      expectedStatus,
      nextStatus,
      safeError,
      expectedUpdatedAt,
    )
  }
}
