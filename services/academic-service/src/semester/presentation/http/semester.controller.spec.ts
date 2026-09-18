import { Test, TestingModule } from '@nestjs/testing'
import { CreateSemesterDto } from './dto/request/create-semester.dto.js'
import { UpdateSemesterDto } from './dto/request/update-semester.dto.js'
import { SemesterQueryDto } from './dto/request/semester-query.dto.js'
import { ActivateSemesterUseCase } from '../../application/use-cases/activate-semester/activate-semester.use-case.js'
import { CreateSemesterUseCase } from '../../application/use-cases/create-semester/create-semester.use-case.js'
import { DeactivateSemesterUseCase } from '../../application/use-cases/deactivate-semester/deactivate-semester.use-case.js'
import { DeleteSemesterUseCase } from '../../application/use-cases/delete-semester/delete-semester.use-case.js'
import { GetSemesterByIdUseCase } from '../../application/use-cases/get-semester-by-id/get-semester-by-id.use-case.js'
import { GetSemestersUseCase } from '../../application/use-cases/get-semesters/get-semesters.use-case.js'
import { UpdateSemesterUseCase } from '../../application/use-cases/update-semester/update-semester.use-case.js'
import { SemesterController } from './semester.controller.js'

describe('SemesterController', () => {
  let controller: SemesterController

  const mockGetSemestersService = { execute: jest.fn() }
  const mockGetSemesterByIdService = { execute: jest.fn() }
  const mockCreateSemesterService = { execute: jest.fn() }
  const mockUpdateSemesterService = { execute: jest.fn() }
  const mockDeleteSemesterService = { execute: jest.fn() }
  const mockActivateSemesterService = { execute: jest.fn() }
  const mockDeactivateSemesterService = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemesterController],
      providers: [
        { provide: GetSemestersUseCase, useValue: mockGetSemestersService },
        {
          provide: GetSemesterByIdUseCase,
          useValue: mockGetSemesterByIdService,
        },
        { provide: CreateSemesterUseCase, useValue: mockCreateSemesterService },
        { provide: UpdateSemesterUseCase, useValue: mockUpdateSemesterService },
        { provide: DeleteSemesterUseCase, useValue: mockDeleteSemesterService },
        {
          provide: ActivateSemesterUseCase,
          useValue: mockActivateSemesterService,
        },
        {
          provide: DeactivateSemesterUseCase,
          useValue: mockDeactivateSemesterService,
        },
      ],
    }).compile()

    controller = module.get<SemesterController>(SemesterController)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should delegate to GetSemestersUseCase with mapped input', async () => {
      const query: SemesterQueryDto = { page: 1, limit: 10 }
      const serviceResult = {
        data: [
          {
            id: 'sem-1',
            academicYearId: 'ay-1',
            typeId: 'type-odd',
            startDate: null,
            endDate: null,
            isActive: true,
            deletedAt: null,
            academicYear: { id: 'ay-1', name: '2024/2025' },
            type: { id: 'type-odd', name: 'ODD' },
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }
      mockGetSemestersService.execute.mockResolvedValue(serviceResult)

      const result = await controller.findAll(query)

      expect(mockGetSemestersService.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        academicYearId: undefined,
        isActive: undefined,
      })
      expect(result.data).toEqual([
        {
          id: 'sem-1',
          academicYearId: 'ay-1',
          typeId: 'type-odd',
          type: { id: 'type-odd', name: 'ODD' },
          isActive: true,
          academicYear: { id: 'ay-1', name: '2024/2025' },
          startDate: null,
          endDate: null,
        },
      ])
      expect(result.meta).toEqual(serviceResult.meta)
    })
  })

  describe('findOne', () => {
    it('should delegate to GetSemesterByIdUseCase with id', async () => {
      const id = 'sem-1'
      const serviceResult = {
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: null,
        endDate: null,
        isActive: true,
        deletedAt: null,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        type: { id: 'type-odd', name: 'ODD' },
      }
      mockGetSemesterByIdService.execute.mockResolvedValue(serviceResult)

      const result = await controller.findOne(id)

      expect(mockGetSemesterByIdService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual({
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        type: { id: 'type-odd', name: 'ODD' },
        isActive: true,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        startDate: null,
        endDate: null,
      })
    })
  })

  describe('create', () => {
    it('should delegate to CreateSemesterUseCase with mapped input', async () => {
      const dto: CreateSemesterDto = {
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: '2025-07-14',
        endDate: '2025-12-20',
        isActive: true,
      }
      const serviceResult = {
        id: 'sem-new',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: new Date('2025-07-14'),
        endDate: new Date('2025-12-20'),
        isActive: true,
        deletedAt: null,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        type: { id: 'type-odd', name: 'ODD' },
      }
      mockCreateSemesterService.execute.mockResolvedValue(serviceResult)

      const result = await controller.create(dto)

      expect(mockCreateSemesterService.execute).toHaveBeenCalledWith({
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: new Date('2025-07-14'),
        endDate: new Date('2025-12-20'),
        isActive: true,
      })
      expect(result).toEqual({
        id: 'sem-new',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        type: { id: 'type-odd', name: 'ODD' },
        isActive: true,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        startDate: new Date('2025-07-14'),
        endDate: new Date('2025-12-20'),
      })
    })

    it('should pass undefined dates when the dto omits them', async () => {
      const dto: CreateSemesterDto = {
        academicYearId: 'ay-1',
        typeId: 'type-odd',
      }
      mockCreateSemesterService.execute.mockResolvedValue({
        id: 'sem-new',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: null,
        endDate: null,
        isActive: false,
        deletedAt: null,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        type: { id: 'type-odd', name: 'ODD' },
      })

      await controller.create(dto)

      expect(mockCreateSemesterService.execute).toHaveBeenCalledWith({
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: undefined,
        endDate: undefined,
        isActive: undefined,
      })
    })
  })

  describe('update', () => {
    it('should delegate to UpdateSemesterUseCase with mapped input', async () => {
      const id = 'sem-1'
      const dto: UpdateSemesterDto = {
        startDate: '2026-01-01',
      }
      const serviceResult = {
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: new Date('2026-01-01'),
        endDate: null,
        isActive: true,
        deletedAt: null,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        type: { id: 'type-odd', name: 'ODD' },
      }
      mockUpdateSemesterService.execute.mockResolvedValue(serviceResult)

      const result = await controller.update(id, dto)

      expect(mockUpdateSemesterService.execute).toHaveBeenCalledWith(id, {
        academicYearId: undefined,
        typeId: undefined,
        startDate: new Date('2026-01-01'),
        endDate: undefined,
      })
      expect(result).toEqual({
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        type: { id: 'type-odd', name: 'ODD' },
        isActive: true,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        startDate: new Date('2026-01-01'),
        endDate: null,
      })
    })

    it('should map an empty-string date to null, clearing it', async () => {
      const id = 'sem-1'
      const dto: UpdateSemesterDto = { startDate: '', endDate: '' }
      mockUpdateSemesterService.execute.mockResolvedValue({
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: null,
        endDate: null,
        isActive: true,
        deletedAt: null,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        type: { id: 'type-odd', name: 'ODD' },
      })

      await controller.update(id, dto)

      expect(mockUpdateSemesterService.execute).toHaveBeenCalledWith(id, {
        academicYearId: undefined,
        typeId: undefined,
        startDate: null,
        endDate: null,
      })
    })
  })

  describe('remove', () => {
    it('should delegate to DeleteSemesterUseCase with id', async () => {
      const id = 'sem-1'
      mockDeleteSemesterService.execute.mockResolvedValue(undefined)

      await controller.remove(id)

      expect(mockDeleteSemesterService.execute).toHaveBeenCalledWith(id)
    })
  })

  describe('activate', () => {
    it('should delegate to ActivateSemesterUseCase with id', async () => {
      const id = 'sem-1'
      const serviceResult = {
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: null,
        endDate: null,
        isActive: true,
        deletedAt: null,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        type: { id: 'type-odd', name: 'ODD' },
      }
      mockActivateSemesterService.execute.mockResolvedValue(serviceResult)

      const result = await controller.activate(id)

      expect(mockActivateSemesterService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual({
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        type: { id: 'type-odd', name: 'ODD' },
        isActive: true,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        startDate: null,
        endDate: null,
      })
    })
  })

  describe('deactivate', () => {
    it('should delegate to DeactivateSemesterUseCase with id', async () => {
      const id = 'sem-1'
      const serviceResult = {
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        startDate: null,
        endDate: null,
        isActive: false,
        deletedAt: null,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        type: { id: 'type-odd', name: 'ODD' },
      }
      mockDeactivateSemesterService.execute.mockResolvedValue(serviceResult)

      const result = await controller.deactivate(id)

      expect(mockDeactivateSemesterService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual({
        id: 'sem-1',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
        type: { id: 'type-odd', name: 'ODD' },
        isActive: false,
        academicYear: { id: 'ay-1', name: '2024/2025' },
        startDate: null,
        endDate: null,
      })
    })
  })
})
