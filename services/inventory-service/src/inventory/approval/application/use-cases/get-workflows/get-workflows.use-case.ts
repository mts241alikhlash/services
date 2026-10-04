import { Injectable } from '@nestjs/common'
import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'

@Injectable()
export class GetWorkflowsUseCase {
  constructor(private readonly approvalRepository: IApprovalRepository) {}

  async execute() {
    return this.approvalRepository.findAllWorkflows()
  }
}
