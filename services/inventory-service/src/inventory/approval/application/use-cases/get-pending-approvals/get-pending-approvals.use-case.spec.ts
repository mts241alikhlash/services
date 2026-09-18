import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'
import { GetPendingApprovalsUseCase } from './get-pending-approvals.use-case.js'

describe('GetPendingApprovalsUseCase', () => {
  const statusLookup = {
    findBySystemKey: jest.fn().mockResolvedValue({ id: 'pending' }),
  }
  it('loads unique loan details once and preserves instance order', async () => {
    const loanInstance = {
      id: 'instance-1',
      workflowId: 'workflow-1',
      referenceId: 'loan-1',
      currentStepSequence: 1,
      workflow: { targetEntity: 'InventoryLoan' },
    }
    const otherInstance = {
      id: 'instance-2',
      workflowId: 'workflow-2',
      referenceId: 'asset-1',
      currentStepSequence: 1,
      workflow: { targetEntity: 'InventoryAsset' },
    }
    const instances = [
      loanInstance,
      otherInstance,
      { ...loanInstance, id: 'instance-3' },
    ]
    const details = {
      id: 'loan-1',
      loanNumber: 'LN-20260914-0001',
      purpose: 'Class activity',
      items: [
        {
          id: 'item-1',
          unitId: 'unit-1',
          unit: {
            id: 'unit-1',
            unitNumber: 'UNIT-001',
            asset: { id: 'asset-1', name: 'Projector' },
          },
        },
      ],
    }
    const roleCodes = ['ADMIN', 'PRINCIPAL']
    const findPendingInstancesForRoles = jest.fn().mockResolvedValue(instances)
    const findLoanDetailsForInstances = jest.fn().mockResolvedValue([details])
    const repository = {
      findPendingInstancesForRoles,
    }
    const loanCapability = {
      findDetailsByIds: findLoanDetailsForInstances,
    } as unknown as IApprovalRepository
    const useCase = new GetPendingApprovalsUseCase(
      repository as unknown as IApprovalRepository,
      statusLookup,
      loanCapability as never,
    )

    await expect(useCase.execute(roleCodes)).resolves.toEqual([
      { ...loanInstance, details },
      { ...otherInstance, details: null },
      { ...loanInstance, id: 'instance-3', details },
    ])
    expect(findPendingInstancesForRoles).toHaveBeenCalledWith(
      roleCodes,
      'pending',
    )
    expect(findLoanDetailsForInstances).toHaveBeenCalledWith(['loan-1'])
    expect(findLoanDetailsForInstances).toHaveBeenCalledTimes(1)
  })

  it('does not look up loan details when reference ID is missing', async () => {
    const instance = {
      id: 'instance-1',
      workflowId: 'workflow-1',
      referenceId: '',
      currentStepSequence: 1,
      workflow: { targetEntity: 'InventoryLoan' },
    }
    const findPendingInstancesForRoles = jest.fn().mockResolvedValue([instance])
    const findLoanDetailsForInstances = jest.fn()
    const repository = {
      findPendingInstancesForRoles,
    } as unknown as IApprovalRepository
    const useCase = new GetPendingApprovalsUseCase(repository, statusLookup, {
      findDetailsByIds: findLoanDetailsForInstances,
    } as never)

    await expect(useCase.execute(['ADMIN'])).resolves.toEqual([
      { ...instance, details: null },
    ])
    expect(findLoanDetailsForInstances).not.toHaveBeenCalled()
  })

  it('does not call the capability when there are no loan instances', async () => {
    const findPendingInstancesForRoles = jest.fn().mockResolvedValue([])
    const findLoanDetailsForInstances = jest.fn()
    const repository = { findPendingInstancesForRoles }
    const useCase = new GetPendingApprovalsUseCase(
      repository as unknown as IApprovalRepository,
      statusLookup,
      { findDetailsByIds: findLoanDetailsForInstances } as never,
    )

    await expect(useCase.execute(['ADMIN'])).resolves.toEqual([])
    expect(findLoanDetailsForInstances).not.toHaveBeenCalled()
  })

  it('maps a missing loan detail result to null', async () => {
    const instance = {
      id: 'instance-1',
      workflowId: 'workflow-1',
      referenceId: 'loan-1',
      currentStepSequence: 1,
      workflow: { targetEntity: 'InventoryLoan' },
    }
    const findPendingInstancesForRoles = jest.fn().mockResolvedValue([instance])
    const findLoanDetailsForInstances = jest.fn().mockResolvedValue([])
    const repository = {
      findPendingInstancesForRoles,
    } as unknown as IApprovalRepository
    const useCase = new GetPendingApprovalsUseCase(repository, statusLookup, {
      findDetailsByIds: findLoanDetailsForInstances,
    } as never)

    await expect(useCase.execute(['ADMIN'])).resolves.toEqual([
      { ...instance, details: null },
    ])
    expect(findLoanDetailsForInstances).toHaveBeenCalledWith(['loan-1'])
  })

  it('propagates pending-instance repository errors', async () => {
    const error = new Error('database unavailable')
    const findPendingInstancesForRoles = jest.fn().mockRejectedValue(error)
    const repository = {
      findPendingInstancesForRoles,
    } as unknown as IApprovalRepository
    const useCase = new GetPendingApprovalsUseCase(repository, statusLookup, {
      findDetailsByIds: jest.fn(),
    } as never)

    await expect(useCase.execute(['ADMIN'])).rejects.toBe(error)
  })

  it('propagates loan-detail repository errors', async () => {
    const error = new Error('loan service unavailable')
    const findPendingInstancesForRoles = jest.fn().mockResolvedValue([
      {
        id: 'instance-1',
        workflowId: 'workflow-1',
        referenceId: 'loan-1',
        currentStepSequence: 1,
        workflow: { targetEntity: 'InventoryLoan' },
      },
    ])
    const findLoanDetailsForInstances = jest.fn().mockRejectedValue(error)
    const repository = {
      findPendingInstancesForRoles,
    } as unknown as IApprovalRepository
    const useCase = new GetPendingApprovalsUseCase(repository, statusLookup, {
      findDetailsByIds: findLoanDetailsForInstances,
    } as never)

    await expect(useCase.execute(['ADMIN'])).rejects.toBe(error)
  })
})
