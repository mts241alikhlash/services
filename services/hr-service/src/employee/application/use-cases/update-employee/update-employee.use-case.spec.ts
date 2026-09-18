import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UpdateEmployeeInput } from './update-employee.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { UpdateEmployeeUseCase } from './update-employee.use-case.js'

describe('UpdateEmployeeUseCase', () => {
  let useCase: UpdateEmployeeUseCase

  const mockRepository = {
    findById: jest.fn(),
    findByNip: jest.fn(),
    findByNuptk: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEmployeeUseCase,
        { provide: IEmployeeRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<UpdateEmployeeUseCase>(UpdateEmployeeUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'emp-1'
    const currentEmployee = {
      id: 'emp-1',
      user: { id: 'u-1' },
      nip: '198006152005011001',
      employmentTypeId: 'emp-type-uuid',
    }

    it('should update an employee successfully', async () => {
      const input: UpdateEmployeeInput = {
        employmentTypeId: 'emp-type-uuid-2',
      }
      const updatedEmployee = {
        ...currentEmployee,
        employmentTypeId: 'emp-type-uuid-2',
      }

      mockRepository.findById.mockResolvedValue(currentEmployee)
      mockRepository.update.mockResolvedValue(updatedEmployee)

      const result = await useCase.execute(id, input)

      expect(mockRepository.findById).toHaveBeenCalledWith(id)
      expect(mockRepository.update).toHaveBeenCalledWith(id, input)
      expect(result).toEqual(updatedEmployee)
    })

    it('should throw NotFoundException when employee is not found', async () => {
      const input: UpdateEmployeeInput = {
        employmentTypeId: 'emp-type-uuid-2',
      }
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute('nonexistent', input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when new NIP is already registered', async () => {
      const input: UpdateEmployeeInput = { nip: '199001012020011002' }
      mockRepository.findById.mockResolvedValue(currentEmployee)
      mockRepository.findByNip.mockResolvedValue({ id: 'other-emp' })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when new NUPTK is already registered', async () => {
      const input: UpdateEmployeeInput = { nuptk: '9999888877776666' }
      mockRepository.findById.mockResolvedValue(currentEmployee)
      mockRepository.findByNuptk.mockResolvedValue({ id: 'other-emp' })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should NOT check NIP uniqueness when nip is not in input', async () => {
      const input: UpdateEmployeeInput = {
        employmentTypeId: 'emp-type-uuid-2',
      }
      mockRepository.findById.mockResolvedValue(currentEmployee)
      mockRepository.update.mockResolvedValue(currentEmployee)

      await useCase.execute(id, input)

      expect(mockRepository.findByNip).not.toHaveBeenCalled()
    })

    it('should NOT check NUPTK uniqueness when nuptk is not in input', async () => {
      const input: UpdateEmployeeInput = {
        employmentTypeId: 'emp-type-uuid-2',
      }
      mockRepository.findById.mockResolvedValue(currentEmployee)
      mockRepository.update.mockResolvedValue(currentEmployee)

      await useCase.execute(id, input)

      expect(mockRepository.findByNuptk).not.toHaveBeenCalled()
    })
  })
})
