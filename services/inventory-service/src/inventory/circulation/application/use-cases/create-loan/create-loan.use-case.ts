import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  IAssetUnitCapabilityPort,
  IAssetUnitMutationPort,
} from '../../../../asset/index.js'
import { IApprovalCapabilityPort } from '../../../../approval/index.js'
import { IStatusLookupPort } from '../../../../reference-data/status/index.js'
import { InventoryReferenceDataMissingException } from '../../../../shared/domain/exceptions/inventory-reference-data-missing.exception.js'
import { IHistoryCapabilityPort } from '../../../domain/repositories/history.repository.js'
import { ILoanRepository } from '../../../domain/repositories/loan.repository.js'
import { ITransactionTypeCapabilityPort } from '../../../domain/repositories/transaction-type.repository.js'
import { CreateLoanInput } from './create-loan.input.js'

@Injectable()
export class CreateLoanUseCase {
  constructor(
    private readonly loanRepository: ILoanRepository,
    private readonly statusLookup: IStatusLookupPort,
    private readonly unitCapability: IAssetUnitCapabilityPort,
    private readonly unitMutation: IAssetUnitMutationPort,
    private readonly approval: IApprovalCapabilityPort,
    private readonly transactionType: ITransactionTypeCapabilityPort,
    private readonly history: IHistoryCapabilityPort,
  ) {}

  async execute(input: CreateLoanInput, requesterId: string) {
    const pendingStatus =
      await this.statusLookup.findBySystemKey('LOAN_PENDING')

    if (!pendingStatus) {
      throw new NotFoundException(
        'The PENDING_APPROVAL status role is not configured under Reference > Asset Status',
      )
    }

    const units = await this.unitCapability.findByIds(input.unitIds)

    if (units.length !== input.unitIds.length) {
      throw new BadRequestException('One or more units do not exist.')
    }

    for (const unit of units) {
      if (!unit.status?.allowTransactions) {
        throw new BadRequestException(
          `Unit "${unit.asset.name}" (${unit.unitNumber}) is not available for borrowing.`,
        )
      }
    }

    const latestLoan = await this.loanRepository.findLatestLoan()
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    let nextSeq = 1
    if (latestLoan?.loanNumber.startsWith(`LN-${todayStr}`)) {
      const parts = latestLoan.loanNumber.split('-')
      nextSeq = parseInt(parts[parts.length - 1] || '0') + 1
    }
    const loanNumber = `LN-${todayStr}-${nextSeq.toString().padStart(4, '0')}`

    const loan = await this.loanRepository.processCreateLoanTransaction({
      loanNumber,
      requesterId,
      expectedReturnDate: new Date(input.expectedReturnDate),
      purpose: input.purpose,
      pendingStatusId: String(pendingStatus.id),
      unitIds: input.unitIds,
    })
    await this.unitMutation.updateStatuses({
      unitIds: input.unitIds,
      statusId: String(pendingStatus.id),
    })
    const workflow = await this.approval.findActiveWorkflow('InventoryLoan')
    if (workflow) {
      const instance = await this.approval.createInstance({
        workflowId: workflow.id,
        referenceId: loan.id,
        statusId: String(pendingStatus.id),
      })
      return this.loanRepository.updateLoan(loan.id, {
        workflowInstanceId: instance.id,
      })
    }
    const approvedStatus =
      await this.statusLookup.findBySystemKey('LOAN_APPROVED')
    const loanedStatus = await this.statusLookup.findBySystemKey('LOANED')
    const loanOutType =
      await this.transactionType.findTransactionTypeByCode('TX-LOAN-OUT')
    const missing: string[] = []
    if (!approvedStatus) missing.push('status role LOAN_APPROVED')
    if (!loanedStatus) missing.push('status role LOANED')
    if (!loanOutType) missing.push('transaction type TX-LOAN-OUT')
    if (!approvedStatus || !loanedStatus || !loanOutType) {
      throw new InventoryReferenceDataMissingException(missing)
    }

    const approvedLoan = await this.loanRepository.updateLoan(loan.id, {
      statusId: approvedStatus.id,
    })
    await this.unitMutation.updateStatuses({
      unitIds: input.unitIds,
      statusId: loanedStatus.id,
    })
    for (const unit of units) {
      await this.history.record({
        unitId: unit.id,
        transactionTypeId: loanOutType.id,
        previousStatusId: unit.statusId,
        newStatusId: loanedStatus.id,
        note: `Peminjaman otomatis disetujui (No. ${loanNumber})`,
        changedById: requesterId,
      })
    }
    return approvedLoan
  }
}
