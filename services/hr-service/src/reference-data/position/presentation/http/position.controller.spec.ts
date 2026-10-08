import { Test, TestingModule } from '@nestjs/testing'
import { CreatePositionDto } from './dto/request/create-position.dto.js'
import { PositionQueryDto } from './dto/request/position-query.dto.js'
import { UpdatePositionDto } from './dto/request/update-position.dto.js'
import { CreatePositionUseCase } from '../../application/use-cases/create-position/create-position.use-case.js'
import { DeletePositionUseCase } from '../../application/use-cases/delete-position/delete-position.use-case.js'
import { GetPositionByIdUseCase } from '../../application/use-cases/get-position-by-id/get-position-by-id.use-case.js'
import { GetPositionsUseCase } from '../../application/use-cases/get-positions/get-positions.use-case.js'
import { UpdatePositionUseCase } from '../../application/use-cases/update-position/update-position.use-case.js'
import { PositionController } from './position.controller.js'

const position = {
  id: 'pos-1',
  name: 'Kepala Sekolah',
  categoryId: 'cat-1',
  isActive: true,
  deletedAt: null,
  category: { id: 'cat-1', code: 'MANAGEMENT', name: 'Management' },
}

const positionResponse = {
  id: 'pos-1',
  name: 'Kepala Sekolah',
  category: { id: 'cat-1', code: 'MANAGEMENT', name: 'Management' },
  isActive: true,
}

describe('PositionController', () => {
  let controller: PositionController

  const mockGetPositionsService = { execute: jest.fn() }
  const mockGetPositionByIdService = { execute: jest.fn() }
  const mockCreatePositionService = { execute: jest.fn() }
  const mockUpdatePositionService = { execute: jest.fn() }
  const mockDeletePositionService = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionController],
      providers: [
        { provide: GetPositionsUseCase, useValue: mockGetPositionsService },
        {
          provide: GetPositionByIdUseCase,
          useValue: mockGetPositionByIdService,
        },
        { provide: CreatePositionUseCase, useValue: mockCreatePositionService },
        { provide: UpdatePositionUseCase, useValue: mockUpdatePositionService },
        { provide: DeletePositionUseCase, useValue: mockDeletePositionService },
      ],
    }).compile()

    controller = module.get<PositionController>(PositionController)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should delegate to GetPositionsUseCase with query', async () => {
      const query: PositionQueryDto = { page: 1, limit: 10 }
      const meta = { page: 1, limit: 10, total: 1, totalPages: 1 }
      mockGetPositionsService.execute.mockResolvedValue({
        data: [position],
        meta,
      })

      const result = await controller.findAll(query)

      expect(mockGetPositionsService.execute).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
        search: query.search,
        categoryId: query.categoryId,
        isActive: query.isActive,
      })
      expect(result).toEqual({ data: [positionResponse], meta })
    })
  })

  describe('findOne', () => {
    it('should delegate to GetPositionByIdUseCase with id', async () => {
      const id = 'pos-1'
      mockGetPositionByIdService.execute.mockResolvedValue(position)

      const result = await controller.findOne(id)

      expect(mockGetPositionByIdService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual(positionResponse)
    })
  })

  describe('create', () => {
    it('should delegate to CreatePositionUseCase with dto', async () => {
      const dto: CreatePositionDto = {
        name: 'Wali Kelas',
        categoryId: 'cat-2',
      }
      mockCreatePositionService.execute.mockResolvedValue(position)

      const result = await controller.create(dto)

      expect(mockCreatePositionService.execute).toHaveBeenCalledWith({
        name: dto.name,
        categoryId: dto.categoryId,
        isActive: dto.isActive,
      })
      expect(result).toEqual(positionResponse)
    })
  })

  describe('update', () => {
    it('should delegate to UpdatePositionUseCase with id and dto', async () => {
      const id = 'pos-1'
      const dto: UpdatePositionDto = { name: 'Kepala Sekolah Updated' }
      mockUpdatePositionService.execute.mockResolvedValue(position)

      const result = await controller.update(id, dto)

      expect(mockUpdatePositionService.execute).toHaveBeenCalledWith(id, {
        name: dto.name,
        categoryId: dto.categoryId,
        isActive: dto.isActive,
      })
      expect(result).toEqual(positionResponse)
    })
  })

  describe('remove', () => {
    it('should delegate to DeletePositionUseCase with id', async () => {
      const id = 'pos-1'
      mockDeletePositionService.execute.mockResolvedValue(undefined)

      await controller.remove(id)

      expect(mockDeletePositionService.execute).toHaveBeenCalledWith(id)
    })
  })
})
