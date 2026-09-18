import { BadRequestException, NotFoundException } from '@nestjs/common'
import { IAssetUnitMutationPort } from '../../../../asset/index.js'
import { IStatusLookupPort } from '../../../../reference-data/status/index.js'
import { InventoryReferenceDataMissingException } from '../../../../shared/domain/exceptions/inventory-reference-data-missing.exception.js'
import { IHistoryCapabilityPort } from '../../../domain/repositories/history.repository.js'
import { ILoanRepository } from '../../../domain/repositories/loan.repository.js'
import { ITransactionTypeRepository } from '../../../domain/repositories/transaction-type.repository.js'
import { ReturnLoanUseCase } from './return-loan.use-case.js'

describe('ReturnLoanUseCase', () => {
  const loan = {
    id: 'loan-1',
    loanNumber: 'LN-20260914-0001',
    requesterId: 'user-1',
    statusId: 'status-pending',
    actualReturnDate: null,
    items: [{ id: 'item-1', loanId: 'loan-1', unitId: 'unit-1' }],
  }
  const input = {
    items: [
      {
        unitId: 'unit-1',
        returnedConditionId: 'condition-good',
        notes: 'No damage',
      },
    ],
  }

  function make(overrides: Record<string, jest.Mock> = {}) {
    const repository = {
      findLoanById: overrides.findLoanById ?? jest.fn().mockResolvedValue(loan),
      processReturnLoanTransaction:
        overrides.processReturnLoanTransaction ??
        jest.fn().mockResolvedValue({ id: 'loan-1' }),
    } as unknown as ILoanRepository
    const status = {
      findBySystemKey:
        overrides.findBySystemKey ??
        jest.fn((key: string) =>
          Promise.resolve(
            key === 'LOAN_RETURNED'
              ? { id: 'status-returned' }
              : { id: 'status-available' },
          ),
        ),
    } as unknown as IStatusLookupPort
    const transactionType = {
      findTransactionTypeByCode:
        overrides.findTransactionTypeByCode ??
        jest.fn().mockResolvedValue({ id: 'tx-loan-in' }),
    } as unknown as ITransactionTypeRepository
    const mutation = {
      updateStatuses: jest.fn().mockResolvedValue(undefined),
      updateCondition: jest.fn().mockResolvedValue(undefined),
    } as unknown as IAssetUnitMutationPort
    const history = {
      record: jest.fn().mockResolvedValue(undefined),
    } as unknown as IHistoryCapabilityPort
    return {
      useCase: new ReturnLoanUseCase(
        repository,
        status,
        transactionType,
        mutation,
        history,
      ),
      repository,
      status,
      transactionType,
      mutation,
      history,
    }
  }

  it('preserves not-found and reference-data errors', async () => {
    const findStatusBySystemKey = jest.fn()
    const { useCase } = make({
      findLoanById: jest.fn().mockResolvedValue(null),
      findBySystemKey: findStatusBySystemKey,
    })
    await expect(
      useCase.execute('missing-loan', input, 'user-1'),
    ).rejects.toEqual(new NotFoundException('Loan transaction not found.'))
    expect(findStatusBySystemKey).not.toHaveBeenCalled()

    await expect(
      make({
        findBySystemKey: jest.fn().mockResolvedValue(null),
        findTransactionTypeByCode: jest.fn().mockResolvedValue(null),
      }).useCase.execute('loan-1', input, 'user-1'),
    ).rejects.toEqual(
      new InventoryReferenceDataMissingException([
        'status role LOAN_RETURNED',
        'status role AVAILABLE',
        'transaction type TX-LOAN-IN',
      ]),
    )
  })

  it('awaits loan, asset, condition, and history calls in order', async () => {
    const events: string[] = []
    const { useCase, repository, mutation, history } = make()
    ;(repository.processReturnLoanTransaction as jest.Mock).mockImplementation(
      () => {
        events.push('loan')
        return { id: 'loan-1' }
      },
    )
    ;(mutation.updateStatuses as jest.Mock).mockImplementation(() => {
      events.push('status')
    })
    ;(mutation.updateCondition as jest.Mock).mockImplementation(() => {
      events.push('condition')
    })
    ;(history.record as jest.Mock).mockImplementation(() => {
      events.push('history')
    })

    await useCase.execute('loan-1', input, 'user-1')

    expect(events).toEqual(['loan', 'status', 'condition', 'history'])
    expect(mutation.updateStatuses).toHaveBeenCalledWith({
      unitIds: ['unit-1'],
      statusId: 'status-available',
    })
    expect(history.record).toHaveBeenCalledWith({
      unitId: 'unit-1',
      transactionTypeId: 'tx-loan-in',
      newStatusId: 'status-available',
      note: 'No damage',
      changedById: 'user-1',
    })
  })

  it('preserves already-returned and foreign-unit errors', async () => {
    await expect(
      make({
        findLoanById: jest.fn().mockResolvedValue({
          ...loan,
          actualReturnDate: new Date('2026-09-14T00:00:00.000Z'),
        }),
      }).useCase.execute('loan-1', input, 'user-1'),
    ).rejects.toEqual(
      new BadRequestException('This loan has already been fully returned.'),
    )

    await expect(
      make().useCase.execute(
        'loan-1',
        { items: [{ ...input.items[0], unitId: 'unit-2' }] },
        'user-1',
      ),
    ).rejects.toEqual(
      new BadRequestException('Unit ID unit-2 is not part of this loan.'),
    )
  })
})
