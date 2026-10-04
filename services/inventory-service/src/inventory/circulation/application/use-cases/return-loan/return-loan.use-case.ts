import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InventoryReferenceDataMissingException } from '../../../../shared/domain/exceptions/inventory-reference-data-missing.exception.js'
import { IAssetUnitMutationPort } from '../../../../asset/index.js'
import { IStatusLookupPort } from '../../../../reference-data/status/index.js'
import { IHistoryCapabilityPort } from '../../../domain/repositories/history.repository.js'
import { ILoanRepository } from '../../../domain/repositories/loan.repository.js'
import { ITransactionTypeRepository } from '../../../domain/repositories/transaction-type.repository.js'
import { ReturnLoanInput } from './return-loan.input.js'

@Injectable()
export class ReturnLoanUseCase {
  constructor(
    private readonly loanRepository: ILoanRepository,
    private readonly statusLookup: IStatusLookupPort,
    private readonly transactionTypeRepository: ITransactionTypeRepository,
    private readonly unitMutation: IAssetUnitMutationPort,
    private readonly history: IHistoryCapabilityPort,
  ) {}

  async execute(id: string, input: ReturnLoanInput, changedById: string) {
    const loan = await this.loanRepository.findLoanById(id)
    if (!loan) {
      throw new NotFoundException('Loan transaction not found.')
    }

    const returnedStatus =
      await this.statusLookup.findBySystemKey('LOAN_RETURNED')
    const availStatus = await this.statusLookup.findBySystemKey('AVAILABLE')
    const txType =
      await this.transactionTypeRepository.findTransactionTypeByCode(
        'TX-LOAN-IN',
      )

    const missing: string[] = []
    if (!returnedStatus) missing.push('status role LOAN_RETURNED')
    if (!availStatus) missing.push('status role AVAILABLE')
    if (!txType) missing.push('transaction type TX-LOAN-IN')
    if (!returnedStatus || !availStatus || !txType) {
      throw new InventoryReferenceDataMissingException(missing)
    }

    if (loan.actualReturnDate) {
      throw new BadRequestException(
        'This loan has already been fully returned.',
      )
    }

    for (const itemInput of input.items) {
      const loanItem = (loan.items ?? []).find(
        (item) => item.unitId === itemInput.unitId,
      )
      if (!loanItem) {
        throw new BadRequestException(
          `Unit ID ${itemInput.unitId} is not part of this loan.`,
        )
      }
    }

    const result = await this.loanRepository.processReturnLoanTransaction({
      loanId: id,
      returnedStatusId: String(returnedStatus.id),
    })
    await this.unitMutation.updateStatuses({
      unitIds: input.items.map((item) => item.unitId),
      statusId: String(availStatus.id),
    })
    for (const item of input.items) {
      if (item.returnedConditionId) {
        await this.unitMutation.updateCondition({
          unitId: item.unitId,
          conditionId: item.returnedConditionId,
        })
      }
      await this.history.record({
        unitId: item.unitId,
        transactionTypeId: String(txType.id),
        newStatusId: String(availStatus.id),
        note: item.notes ?? `Pengembalian pinjaman (No. ${loan.loanNumber})`,
        changedById,
      })
    }
    return result
  }
}
