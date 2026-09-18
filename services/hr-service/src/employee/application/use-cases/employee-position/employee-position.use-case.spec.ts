import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import {
  CreateEmployeePositionInput,
  UpdateEmployeePositionInput,
} from './employee-position.input.js'
import { IEmployeePositionRepository } from '../../../domain/repositories/employee-position.repository.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { EmployeePositionUseCase } from './employee-position.use-case.js'

describe('EmployeePositionUseCase', () => {
  let useCase: EmployeePositionUseCase

  const mockEmployeeRepository = {
    findById: jest.fn(),
  }

  const mockPositionRepository = {
    findByEmployeeId: jest.fn(),
    findPositionById: jest.fn(),
    findByEmployeeAndPosition: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePositionUseCase,
        { provide: IEmployeeRepository, useValue: mockEmployeeRepository },
        {
          provide: IEmployeePositionRepository,
          useValue: mockPositionRepository,
        },
      ],
    }).compile()

    useCase = module.get<EmployeePositionUseCase>(EmployeePositionUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  const employeeId = 'emp-1'
  const linkId = 'link-1'
  const mockEmployee = { id: 'emp-1', user: { id: 'u-1' } }

  describe('findAll', () => {
    it('should return all position assignments for an employee', async () => {
      const mockPositions = [{ id: 'link-1', position: { name: 'Guru Kelas' } }]
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findByEmployeeId.mockResolvedValue(mockPositions)

      const result = await useCase.findAll(employeeId)

      expect(mockEmployeeRepository.findById).toHaveBeenCalledWith(employeeId)
      expect(mockPositionRepository.findByEmployeeId).toHaveBeenCalledWith(
        employeeId,
      )
      expect(result).toEqual(mockPositions)
    })

    it('should throw NotFoundException when employee is not found', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(null)

      await expect(useCase.findAll(employeeId)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockPositionRepository.findByEmployeeId).not.toHaveBeenCalled()
    })
  })

  describe('assign', () => {
    const input: CreateEmployeePositionInput = {
      positionId: 'pos-1',
      hireDate: '2020-01-01',
    }
    const activePosition = { id: 'pos-1', name: 'Guru Kelas', isActive: true }
    const mockLink = { id: 'link-1', positionId: 'pos-1' }

    it('should assign a position to an employee successfully', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findPositionById.mockResolvedValue(activePosition)
      mockPositionRepository.findByEmployeeAndPosition.mockResolvedValue(null)
      mockPositionRepository.create.mockResolvedValue(mockLink)

      const result = await useCase.assign(employeeId, input)

      expect(mockPositionRepository.findPositionById).toHaveBeenCalledWith(
        input.positionId,
      )
      expect(mockPositionRepository.create).toHaveBeenCalledWith(employeeId, {
        ...input,
        hireDate: new Date(input.hireDate),
      })
      expect(result).toEqual(mockLink)
    })

    it('should throw NotFoundException when employee is not found', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(null)

      await expect(useCase.assign(employeeId, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockPositionRepository.create).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when position does not exist', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findPositionById.mockResolvedValue(null)

      await expect(useCase.assign(employeeId, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockPositionRepository.create).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when position is inactive', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findPositionById.mockResolvedValue({
        ...activePosition,
        isActive: false,
      })

      await expect(useCase.assign(employeeId, input)).rejects.toThrow(
        BadRequestException,
      )
      expect(mockPositionRepository.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when same position already assigned on that date', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findPositionById.mockResolvedValue(activePosition)
      mockPositionRepository.findByEmployeeAndPosition.mockResolvedValue({
        id: 'existing-link',
      })

      await expect(useCase.assign(employeeId, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockPositionRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    const input: UpdateEmployeePositionInput = { isPrimary: true }

    it('should update a position assignment successfully', async () => {
      const updatedLink = { id: 'link-1', isPrimary: true }
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findById.mockResolvedValue({ id: 'link-1' })
      mockPositionRepository.update.mockResolvedValue(updatedLink)

      const result = await useCase.update(employeeId, linkId, input)

      expect(mockPositionRepository.update).toHaveBeenCalledWith(
        employeeId,
        linkId,
        input,
      )
      expect(result).toEqual(updatedLink)
    })

    it('should throw NotFoundException when employee is not found', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(null)

      await expect(useCase.update(employeeId, linkId, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockPositionRepository.update).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when position assignment is not found', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findById.mockResolvedValue(null)

      await expect(useCase.update(employeeId, linkId, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockPositionRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should remove a position assignment successfully', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findById.mockResolvedValue({ id: 'link-1' })
      mockPositionRepository.softDelete.mockResolvedValue(undefined)

      await useCase.remove(employeeId, linkId)

      expect(mockPositionRepository.softDelete).toHaveBeenCalledWith(
        employeeId,
        linkId,
      )
    })

    it('should throw NotFoundException when employee is not found', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(null)

      await expect(useCase.remove(employeeId, linkId)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockPositionRepository.softDelete).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when assignment is not found', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee)
      mockPositionRepository.findById.mockResolvedValue(null)

      await expect(useCase.remove(employeeId, linkId)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockPositionRepository.softDelete).not.toHaveBeenCalled()
    })
  })
})
