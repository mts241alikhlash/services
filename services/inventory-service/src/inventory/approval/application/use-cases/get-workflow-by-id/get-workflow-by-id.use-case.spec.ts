import { NotFoundException } from '@nestjs/common'
import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'
import { GetWorkflowByIdUseCase } from './get-workflow-by-id.use-case.js'

describe('GetWorkflowByIdUseCase', () => {
  it('delegates the ID and returns the found workflow', async () => {
    const workflow = {
      id: 'workflow-1',
      name: 'Loan approval',
      targetEntity: 'InventoryLoan',
      isActive: true,
      steps: [],
    }
    const findWorkflowById = jest.fn().mockResolvedValue(workflow)
    const repository = { findWorkflowById } as unknown as IApprovalRepository
    const useCase = new GetWorkflowByIdUseCase(repository)

    await expect(useCase.execute('workflow-1')).resolves.toBe(workflow)
    expect(findWorkflowById).toHaveBeenCalledWith('workflow-1')
  })

  it('throws when the workflow does not exist', async () => {
    const findWorkflowById = jest.fn().mockResolvedValue(null)
    const repository = { findWorkflowById } as unknown as IApprovalRepository
    const useCase = new GetWorkflowByIdUseCase(repository)

    await expect(useCase.execute('missing-workflow')).rejects.toEqual(
      new NotFoundException('Workflow template not found.'),
    )
    expect(findWorkflowById).toHaveBeenCalledWith('missing-workflow')
  })

  it('propagates repository read errors', async () => {
    const error = new Error('database unavailable')
    const findWorkflowById = jest.fn().mockRejectedValue(error)
    const repository = { findWorkflowById } as unknown as IApprovalRepository
    const useCase = new GetWorkflowByIdUseCase(repository)

    await expect(useCase.execute('workflow-1')).rejects.toBe(error)
  })
})
