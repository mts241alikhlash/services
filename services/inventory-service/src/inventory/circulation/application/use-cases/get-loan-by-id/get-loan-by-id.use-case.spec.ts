import { NotFoundException } from '@nestjs/common'
import { ILoanRepository } from '../../../domain/repositories/loan.repository.js'
import { GetLoanByIdUseCase } from './get-loan-by-id.use-case.js'

describe('GetLoanByIdUseCase', () => {
  it('delegates the ID and returns the found loan', async () => {
    const loan = { id: 'loan-1', loanNumber: 'LN-20260914-0001' }
    const findLoanById = jest.fn().mockResolvedValue(loan)
    const repository = { findLoanById } as unknown as ILoanRepository
    const useCase = new GetLoanByIdUseCase(repository)

    await expect(useCase.execute('loan-1')).resolves.toBe(loan)
    expect(findLoanById).toHaveBeenCalledWith('loan-1')
  })

  it('throws when the loan does not exist', async () => {
    const findLoanById = jest.fn().mockResolvedValue(null)
    const repository = { findLoanById } as unknown as ILoanRepository
    const useCase = new GetLoanByIdUseCase(repository)

    await expect(useCase.execute('missing-loan')).rejects.toEqual(
      new NotFoundException('Loan transaction not found.'),
    )
    expect(findLoanById).toHaveBeenCalledWith('missing-loan')
  })
})
