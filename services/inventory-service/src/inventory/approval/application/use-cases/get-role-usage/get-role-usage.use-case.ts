import { Injectable } from '@nestjs/common'
import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'

export interface RoleUsage {
  roleCode: string
  steps: number
  workflows: string[]
}

@Injectable()
export class GetRoleUsageUseCase {
  constructor(private readonly approvalRepository: IApprovalRepository) {}

  async execute(): Promise<RoleUsage[]> {
    const usage = new Map<string, RoleUsage>()
    for (const workflow of await this.approvalRepository.findAllWorkflows()) {
      if (!workflow.isActive) continue
      for (const step of workflow.steps ?? []) {
        const entry = usage.get(step.approverRoleCode) ?? {
          roleCode: step.approverRoleCode,
          steps: 0,
          workflows: [],
        }
        entry.steps += 1
        if (!entry.workflows.includes(workflow.name)) {
          entry.workflows.push(workflow.name)
        }
        usage.set(step.approverRoleCode, entry)
      }
    }
    return [...usage.values()].sort((a, b) =>
      a.roleCode.localeCompare(b.roleCode),
    )
  }
}
