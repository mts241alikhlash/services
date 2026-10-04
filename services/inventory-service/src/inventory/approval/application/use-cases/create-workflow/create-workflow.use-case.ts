import { BadRequestException, Injectable } from '@nestjs/common'
import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'
import { CreateWorkflowInput } from './create-workflow.input.js'

@Injectable()
export class CreateWorkflowUseCase {
  constructor(private readonly approvalRepository: IApprovalRepository) {}

  async execute(input: CreateWorkflowInput) {
    const steps = [...input.steps].sort(
      (a, b) => a.stepSequence - b.stepSequence,
    )

    if (steps.length === 0) {
      throw new BadRequestException(
        'A workflow needs at least one approval step.',
      )
    }

    const expected = steps.map((_, index) => index + 1)
    const actual = steps.map((step) => step.stepSequence)
    if (actual.join(',') !== expected.join(',')) {
      throw new BadRequestException(
        `Approval steps must be numbered 1 to ${steps.length} with no gaps or duplicates.`,
      )
    }

    if (steps[0].isMandatory === false) {
      throw new BadRequestException(
        'The first approval step cannot be optional — there is no earlier approver to decide whether to skip it.',
      )
    }

    return this.approvalRepository.createWorkflow({
      name: input.name,
      targetEntity: input.targetEntity,
      description: input.description ?? null,
      isActive: true,
      steps: steps.map((step) => ({
        stepSequence: step.stepSequence,
        approverRoleCode: step.approverRoleCode,
        isMandatory: step.isMandatory ?? true,
      })),
    })
  }
}
