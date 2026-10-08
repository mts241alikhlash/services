import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { ISalaryComponentRepository } from '../domain/interfaces/salary-component-repository.interface.js'
import {
  CreateSalaryComponentUseCase,
  UpdateSalaryComponentUseCase,
  DeleteSalaryComponentUseCase,
} from './manage-salary-component.use-case.js'

describe('salary component writes', () => {
  const repository = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countAssignments: jest.fn(),
    softDelete: jest.fn(),
  }
  const port = repository as unknown as ISalaryComponentRepository
  const create = new CreateSalaryComponentUseCase(port)
  const update = new UpdateSalaryComponentUseCase(port)
  const remove = new DeleteSalaryComponentUseCase(port)

  beforeEach(() => {
    jest.resetAllMocks()
    repository.findByCode.mockResolvedValue(null)
    repository.findById.mockResolvedValue({
      id: 'c-1',
      type: 'BASE',
      driver: null,
    })
    repository.countAssignments.mockResolvedValue(0)
  })

  it('rejects an attendance-driven component without a driver', async () => {
    await expect(
      create.execute({
        code: 'HADIR',
        name: 'Hadir',
        type: 'ATTENDANCE_DRIVEN',
      }),
    ).rejects.toThrow(UnprocessableEntityException)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('rejects an existing component code', async () => {
    repository.findByCode.mockResolvedValue({ id: 'c-1' })
    await expect(
      create.execute({ code: 'GAJI', name: 'Gaji', type: 'BASE' }),
    ).rejects.toThrow(ConflictException)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('persists a valid component with its driver', async () => {
    await create.execute({
      code: 'HADIR',
      name: 'Hadir',
      type: 'ATTENDANCE_DRIVEN',
      driver: 'PRESENT_DAYS',
    })
    expect(repository.create).toHaveBeenCalledWith({
      code: 'HADIR',
      name: 'Hadir',
      type: 'ATTENDANCE_DRIVEN',
      driver: 'PRESENT_DAYS',
    })
  })

  it('rejects updates to missing or incoherent components', async () => {
    repository.findById.mockResolvedValueOnce(null)
    await expect(update.execute('c-1', { name: 'Baru' })).rejects.toThrow(
      NotFoundException,
    )
    await expect(
      update.execute('c-1', { type: 'ATTENDANCE_DRIVEN' }),
    ).rejects.toThrow(UnprocessableEntityException)
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('allows changing a driven component to fixed when the driver is cleared', async () => {
    repository.findById.mockResolvedValue({
      id: 'c-1',
      type: 'ATTENDANCE_DRIVEN',
      driver: 'PRESENT_DAYS',
    })
    await update.execute('c-1', { type: 'BASE', driver: null as never })
    expect(repository.update).toHaveBeenCalledWith('c-1', {
      type: 'BASE',
      driver: null,
    })
  })

  it('refuses deletion while employees have assignments', async () => {
    repository.countAssignments.mockResolvedValue(1)
    await expect(remove.execute('c-1')).rejects.toThrow(ConflictException)
    expect(repository.softDelete).not.toHaveBeenCalled()
  })

  it('soft-deletes an unused component', async () => {
    await remove.execute('c-1')
    expect(repository.softDelete).toHaveBeenCalledWith('c-1')
  })
})
