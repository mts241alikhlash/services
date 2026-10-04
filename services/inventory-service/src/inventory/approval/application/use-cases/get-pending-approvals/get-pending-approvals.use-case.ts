import { Injectable } from '@nestjs/common'
import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'
import { ILoanCapabilityPort } from '../../../../circulation/index.js'
import { IStatusLookupPort } from '../../../../reference-data/status/index.js'

@Injectable()
export class GetPendingApprovalsUseCase {
  constructor(
    private readonly approvalRepository: IApprovalRepository,
    private readonly statusLookup: IStatusLookupPort,
    private readonly loanCapability: ILoanCapabilityPort,
  ) {}

  async execute(roleCodes: string[]) {
    const pendingStatus =
      await this.statusLookup.findBySystemKey('LOAN_PENDING')
    if (!pendingStatus) return []

    const instances =
      await this.approvalRepository.findPendingInstancesForRoles(
        roleCodes,
        pendingStatus.id,
      )

    const loanIds = [
      ...new Set(
        instances
          .filter(
            (instance) =>
              instance.workflow?.targetEntity === 'InventoryLoan' &&
              instance.referenceId,
          )
          .map((instance) => instance.referenceId),
      ),
    ]
    const details =
      loanIds.length > 0
        ? await this.loanCapability.findDetailsByIds(loanIds)
        : []
    const detailsById = new Map(details.map((detail) => [detail.id, detail]))

    return instances.map((instance) => ({
      ...instance,
      details:
        instance.workflow?.targetEntity === 'InventoryLoan' &&
        instance.referenceId
          ? (detailsById.get(instance.referenceId) ?? null)
          : null,
    }))
  }
}
