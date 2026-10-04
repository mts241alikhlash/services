import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'
import { GetWorkflowsUseCase } from './get-workflows.use-case.js'

describe('GetWorkflowsUseCase', () => {
  it('delegates to the repository and returns all workflows', async () => {
    const workflows = [
      {
        id: 'workflow-1',
        name: 'Loan approval',
        targetEntity: 'InventoryLoan',
        isActive: true,
      },
    ]
    const findAllWorkflows = jest.fn().mockResolvedValue(workflows)
    const repository = { findAllWorkflows } as unknown as IApprovalRepository
    const useCase = new GetWorkflowsUseCase(repository)

    await expect(useCase.execute()).resolves.toBe(workflows)
    expect(findAllWorkflows).toHaveBeenCalledTimes(1)
    expect(findAllWorkflows).toHaveBeenCalledWith()
  })

  it('propagates repository read errors', async () => {
    const error = new Error('database unavailable')
    const findAllWorkflows = jest.fn().mockRejectedValue(error)
    const repository = { findAllWorkflows } as unknown as IApprovalRepository
    const useCase = new GetWorkflowsUseCase(repository)

    await expect(useCase.execute()).rejects.toBe(error)
  })
})
