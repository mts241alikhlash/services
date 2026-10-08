import { Test, TestingModule } from '@nestjs/testing'
import { CreateEmployeePositionDto } from './dto/request/create-employee-position.dto.js'
import { UpdateEmployeePositionDto } from './dto/request/update-employee-position.dto.js'
import { EmployeePositionUseCase } from '../../application/use-cases/employee-position/employee-position.use-case.js'
import { EmployeePositionsController } from './employee-position.controller.js'

const link = {
  id: 'link-1',
  employeeId: 'emp-1',
  positionId: 'pos-1',
  isPrimary: true,
  hireDate: new Date('2020-01-01T00:00:00.000Z'),
  deletedAt: null,
  position: {
    id: 'pos-1',
    name: 'Guru Kelas',
    categoryId: 'cat-1',
    isActive: true,
    category: { id: 'cat-1', code: 'ACADEMIC', name: 'Academic' },
  },
}

const linkResponse = {
  id: 'link-1',
  positionId: 'pos-1',
  hireDate: '2020-01-01T00:00:00.000Z',
  isPrimary: true,
  position: {
    id: 'pos-1',
    name: 'Guru Kelas',
    isActive: true,
    category: { id: 'cat-1', code: 'ACADEMIC', name: 'Academic' },
  },
}

describe('EmployeePositionsController', () => {
  let controller: EmployeePositionsController

  const mockPositionUseCase = {
    findAll: jest.fn(),
    assign: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeePositionsController],
      providers: [
        { provide: EmployeePositionUseCase, useValue: mockPositionUseCase },
      ],
    }).compile()

    controller = module.get<EmployeePositionsController>(
      EmployeePositionsController,
    )
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should delegate to EmployeePositionUseCase.findAll with employeeId', async () => {
      const id = 'emp-1'
      mockPositionUseCase.findAll.mockResolvedValue([link])

      const result = await controller.findAll(id)

      expect(mockPositionUseCase.findAll).toHaveBeenCalledWith(id)
      expect(result).toEqual([linkResponse])
    })
  })

  describe('assign', () => {
    it('should delegate to EmployeePositionUseCase.assign with employeeId and dto', async () => {
      const id = 'emp-1'
      const dto: CreateEmployeePositionDto = {
        positionId: '550e8400-e29b-41d4-a716-446655440007',
        hireDate: '2020-01-01',
      }
      mockPositionUseCase.assign.mockResolvedValue(link)

      const result = await controller.assign(id, dto)

      expect(mockPositionUseCase.assign).toHaveBeenCalledWith(id, dto)
      expect(result).toEqual(linkResponse)
    })
  })

  describe('update', () => {
    it('should delegate to EmployeePositionUseCase.update with ids and dto', async () => {
      const id = 'emp-1'
      const positionId = 'link-1'
      const dto: UpdateEmployeePositionDto = { isPrimary: true }
      mockPositionUseCase.update.mockResolvedValue(link)

      const result = await controller.update(id, positionId, dto)

      expect(mockPositionUseCase.update).toHaveBeenCalledWith(
        id,
        positionId,
        dto,
      )
      expect(result).toEqual(linkResponse)
    })
  })

  describe('remove', () => {
    it('should delegate to EmployeePositionUseCase.remove with ids', async () => {
      const id = 'emp-1'
      const positionId = 'link-1'
      mockPositionUseCase.remove.mockResolvedValue(undefined)

      await controller.remove(id, positionId)

      expect(mockPositionUseCase.remove).toHaveBeenCalledWith(id, positionId)
    })
  })
})
