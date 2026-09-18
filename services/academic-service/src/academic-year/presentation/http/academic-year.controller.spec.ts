import { Test, TestingModule } from '@nestjs/testing'
import { CreateAcademicYearDto } from './dto/request/create-academic-year.dto.js'
import { UpdateAcademicYearDto } from './dto/request/update-academic-year.dto.js'
import { AcademicYearQueryDto } from './dto/request/academic-year-query.dto.js'
import { CreateAcademicYearUseCase } from '../../application/use-cases/create-academic-year/create-academic-year.use-case.js'
import { DeleteAcademicYearUseCase } from '../../application/use-cases/delete-academic-year/delete-academic-year.use-case.js'
import { GetAcademicYearByIdUseCase } from '../../application/use-cases/get-academic-year-by-id/get-academic-year-by-id.use-case.js'
import { GetAcademicYearsUseCase } from '../../application/use-cases/get-academic-years/get-academic-years.use-case.js'
import { UpdateAcademicYearUseCase } from '../../application/use-cases/update-academic-year/update-academic-year.use-case.js'
import { ActivateAcademicYearUseCase } from '../../application/use-cases/activate-academic-year/activate-academic-year.use-case.js'
import { DeactivateAcademicYearUseCase } from '../../application/use-cases/deactivate-academic-year/deactivate-academic-year.use-case.js'
import { AcademicYearController } from './academic-year.controller.js'

describe('AcademicYearController', () => {
  let controller: AcademicYearController

  const mockGetAcademicYearsService = { execute: jest.fn() }
  const mockGetAcademicYearByIdService = { execute: jest.fn() }
  const mockCreateAcademicYearService = { execute: jest.fn() }
  const mockUpdateAcademicYearService = { execute: jest.fn() }
  const mockDeleteAcademicYearService = { execute: jest.fn() }
  const mockActivateAcademicYearService = { execute: jest.fn() }
  const mockDeactivateAcademicYearService = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicYearController],
      providers: [
        {
          provide: GetAcademicYearsUseCase,
          useValue: mockGetAcademicYearsService,
        },
        {
          provide: GetAcademicYearByIdUseCase,
          useValue: mockGetAcademicYearByIdService,
        },
        {
          provide: CreateAcademicYearUseCase,
          useValue: mockCreateAcademicYearService,
        },
        {
          provide: UpdateAcademicYearUseCase,
          useValue: mockUpdateAcademicYearService,
        },
        {
          provide: DeleteAcademicYearUseCase,
          useValue: mockDeleteAcademicYearService,
        },
        {
          provide: ActivateAcademicYearUseCase,
          useValue: mockActivateAcademicYearService,
        },
        {
          provide: DeactivateAcademicYearUseCase,
          useValue: mockDeactivateAcademicYearService,
        },
      ],
    }).compile()

    controller = module.get<AcademicYearController>(AcademicYearController)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should delegate to GetAcademicYearsUseCase with query', async () => {
      const query: AcademicYearQueryDto = { page: 1, limit: 10 }
      const serviceResult = {
        data: [
          {
            id: 'ay-1',
            name: '2024/2025',
            startYear: 2024,
            isActive: true,
            deletedAt: null,
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }
      mockGetAcademicYearsService.execute.mockResolvedValue(serviceResult)

      const result = await controller.findAll(query)

      expect(mockGetAcademicYearsService.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
      })
      expect(result.data).toEqual([
        { id: 'ay-1', name: '2024/2025', startYear: 2024, isActive: true },
      ])
      expect(result.meta).toEqual(serviceResult.meta)
    })
  })

  describe('findOne', () => {
    it('should delegate to GetAcademicYearByIdUseCase with id', async () => {
      const id = 'ay-1'
      const serviceResult = {
        id: 'ay-1',
        name: '2024/2025',
        startYear: 2024,
        isActive: true,
        deletedAt: null,
      }
      mockGetAcademicYearByIdService.execute.mockResolvedValue(serviceResult)

      const result = await controller.findOne(id)

      expect(mockGetAcademicYearByIdService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual({
        id: 'ay-1',
        name: '2024/2025',
        startYear: 2024,
        isActive: true,
      })
    })
  })

  describe('create', () => {
    it('should delegate to CreateAcademicYearUseCase with mapped input', async () => {
      const dto: CreateAcademicYearDto = { name: '2025/2026', startYear: 2024 }
      const serviceResult = {
        id: 'ay-new',
        name: '2025/2026',
        startYear: 2024,
        isActive: false,
        deletedAt: null,
      }
      mockCreateAcademicYearService.execute.mockResolvedValue(serviceResult)

      const result = await controller.create(dto)

      expect(mockCreateAcademicYearService.execute).toHaveBeenCalledWith({
        name: '2025/2026',
        startYear: 2024,
        isActive: undefined,
      })
      expect(result).toEqual({
        id: 'ay-new',
        name: '2025/2026',
        startYear: 2024,
        isActive: false,
      })
    })
  })

  describe('update', () => {
    it('should delegate to UpdateAcademicYearUseCase with mapped input', async () => {
      const id = 'ay-1'
      const dto: UpdateAcademicYearDto = {
        name: 'Updated 2025/2026',
        startYear: 2024,
      }
      const serviceResult = {
        id: 'ay-1',
        name: 'Updated 2025/2026',
        startYear: 2024,
        isActive: false,
        deletedAt: null,
      }
      mockUpdateAcademicYearService.execute.mockResolvedValue(serviceResult)

      const result = await controller.update(id, dto)

      expect(mockUpdateAcademicYearService.execute).toHaveBeenCalledWith(id, {
        name: 'Updated 2025/2026',
        startYear: 2024,
      })
      expect(result).toEqual({
        id: 'ay-1',
        name: 'Updated 2025/2026',
        startYear: 2024,
        isActive: false,
      })
    })
  })

  describe('remove', () => {
    it('should delegate to DeleteAcademicYearUseCase with id', async () => {
      const id = 'ay-1'
      mockDeleteAcademicYearService.execute.mockResolvedValue(undefined)

      await controller.remove(id)

      expect(mockDeleteAcademicYearService.execute).toHaveBeenCalledWith(id)
    })
  })

  describe('activate', () => {
    it('should delegate to ActivateAcademicYearUseCase with id', async () => {
      const id = 'ay-1'
      const serviceResult = {
        id: 'ay-1',
        name: '2024/2025',
        startYear: 2024,
        isActive: true,
        deletedAt: null,
      }
      mockActivateAcademicYearService.execute.mockResolvedValue(serviceResult)

      const result = await controller.activate(id)

      expect(mockActivateAcademicYearService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual({
        id: 'ay-1',
        name: '2024/2025',
        startYear: 2024,
        isActive: true,
      })
    })
  })

  describe('deactivate', () => {
    it('should delegate to DeactivateAcademicYearUseCase with id', async () => {
      const id = 'ay-1'
      const serviceResult = {
        id: 'ay-1',
        name: '2024/2025',
        startYear: 2024,
        isActive: false,
        deletedAt: null,
      }
      mockDeactivateAcademicYearService.execute.mockResolvedValue(serviceResult)

      const result = await controller.deactivate(id)

      expect(mockDeactivateAcademicYearService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual({
        id: 'ay-1',
        name: '2024/2025',
        startYear: 2024,
        isActive: false,
      })
    })
  })
})
