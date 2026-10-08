import { NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { ISalaryComponentRepository } from '../../component/domain/interfaces/salary-component-repository.interface.js'
import { ISalaryAssignmentRepository } from '../domain/interfaces/salary-assignment-repository.interface.js'
import {
  CreateSalaryAssignmentUseCase,
  DeleteSalaryAssignmentUseCase,
} from './manage-salary-assignment.use-case.js'

describe('salary assignment writes', () => {
  const assignments = {
    create: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn(),
  }
  const components = { findById: jest.fn() }
  const create = new CreateSalaryAssignmentUseCase(
    assignments as unknown as ISalaryAssignmentRepository,
    components as unknown as ISalaryComponentRepository,
  )
  const remove = new DeleteSalaryAssignmentUseCase(
    assignments as unknown as ISalaryAssignmentRepository,
  )
  const input = {
    userId: 'u-1',
    componentId: 'c-1',
    effectiveFrom: '2026-10-07',
  }

  beforeEach(() => {
    jest.resetAllMocks()
    components.findById.mockResolvedValue({
      id: 'c-1',
      name: 'Gaji',
      isActive: true,
      driver: null,
    })
  })

  it('rejects missing or inactive components', async () => {
    components.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'c-1', isActive: false })
    await expect(
      create.execute({ ...input, amount: '100.00' }, 'admin'),
    ).rejects.toThrow(NotFoundException)
    await expect(
      create.execute({ ...input, amount: '100.00' }, 'admin'),
    ).rejects.toThrow(NotFoundException)
    expect(assignments.create).not.toHaveBeenCalled()
  })

  it('requires a rate alone for attendance-driven components', async () => {
    components.findById.mockResolvedValue({
      name: 'Hadir',
      isActive: true,
      driver: 'PRESENT_DAYS',
    })
    await expect(
      create.execute({ ...input, amount: '100.00' }, 'admin'),
    ).rejects.toThrow(UnprocessableEntityException)
    await expect(
      create.execute({ ...input, amount: '100.00', rate: '25.00' }, 'admin'),
    ).rejects.toThrow(UnprocessableEntityException)
    expect(assignments.create).not.toHaveBeenCalled()

    await create.execute({ ...input, rate: '25.00' }, 'admin')
    expect(assignments.create).toHaveBeenCalledWith({
      userId: 'u-1',
      componentId: 'c-1',
      amount: null,
      rate: '25.00',
      effectiveFrom: new Date('2026-10-07T00:00:00.000Z'),
      createdBy: 'admin',
    })
  })

  it('requires an amount alone for fixed components', async () => {
    await expect(
      create.execute({ ...input, rate: '25.00' }, 'admin'),
    ).rejects.toThrow(UnprocessableEntityException)
    await expect(
      create.execute({ ...input, amount: '100.00', rate: '25.00' }, 'admin'),
    ).rejects.toThrow(UnprocessableEntityException)
    await create.execute({ ...input, amount: '100.00' }, 'admin')
    expect(assignments.create).toHaveBeenCalledWith({
      userId: 'u-1',
      componentId: 'c-1',
      amount: '100.00',
      rate: null,
      effectiveFrom: new Date('2026-10-07T00:00:00.000Z'),
      createdBy: 'admin',
    })
  })

  it('rejects deletion of a missing assignment and soft-deletes an existing one', async () => {
    assignments.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'a-1' })
    await expect(remove.execute('a-1')).rejects.toThrow(NotFoundException)
    await remove.execute('a-1')
    expect(assignments.softDelete).toHaveBeenCalledTimes(1)
    expect(assignments.softDelete).toHaveBeenCalledWith('a-1')
  })
})
