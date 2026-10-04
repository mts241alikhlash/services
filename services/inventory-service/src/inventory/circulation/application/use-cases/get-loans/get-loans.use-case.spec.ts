import { ILoanRepository } from '../../../domain/repositories/loan.repository.js'
import { GetLoansUseCase } from './get-loans.use-case.js'

describe('GetLoansUseCase', () => {
  it('maps every query field and returns the repository result', async () => {
    const result = {
      data: [{ id: 'loan-1' }],
      meta: { page: 2, limit: 20, total: 1, totalPages: 1 },
    }
    const findAllLoans = jest.fn().mockResolvedValue(result)
    const repository = { findAllLoans } as unknown as ILoanRepository
    const useCase = new GetLoansUseCase(repository)
    const query = {
      page: 2,
      limit: 20,
      keyword: 'laptop',
      statusId: 'status-1',
      requesterId: 'requester-1',
    }

    await expect(useCase.execute(query)).resolves.toBe(result)
    expect(findAllLoans).toHaveBeenCalledWith(query)
  })

  it('forwards an empty query with explicit undefined fields', async () => {
    const findAllLoans = jest.fn().mockResolvedValue({ data: [] })
    const repository = { findAllLoans } as unknown as ILoanRepository
    const useCase = new GetLoansUseCase(repository)

    await useCase.execute({})

    expect(findAllLoans).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
      keyword: undefined,
      statusId: undefined,
      requesterId: undefined,
    })
  })
})
