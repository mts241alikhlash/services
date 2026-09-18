import { Test, TestingModule } from '@nestjs/testing'
import { CreateOccupationDto } from './dto/request/create-occupation.dto.js'
import { OccupationQueryDto } from './dto/request/occupation-query.dto.js'
import { UpdateOccupationDto } from './dto/request/update-occupation.dto.js'
import { CreateOccupationUseCase } from '../../application/use-cases/create-occupation/create-occupation.use-case.js'
import { DeleteOccupationUseCase } from '../../application/use-cases/delete-occupation/delete-occupation.use-case.js'
import { GetOccupationByIdUseCase } from '../../application/use-cases/get-occupation-by-id/get-occupation-by-id.use-case.js'
import { GetOccupationsUseCase } from '../../application/use-cases/get-occupations/get-occupations.use-case.js'
import { UpdateOccupationUseCase } from '../../application/use-cases/update-occupation/update-occupation.use-case.js'
import { OccupationController } from './occupation.controller.js'

describe('OccupationController', () => {
  let controller: OccupationController

  const mockGetOccupationsService = { execute: jest.fn() }
  const mockGetOccupationByIdService = { execute: jest.fn() }
  const mockCreateOccupationService = { execute: jest.fn() }
  const mockUpdateOccupationService = { execute: jest.fn() }
  const mockDeleteOccupationService = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OccupationController],
      providers: [
        { provide: GetOccupationsUseCase, useValue: mockGetOccupationsService },
        {
          provide: GetOccupationByIdUseCase,
          useValue: mockGetOccupationByIdService,
        },
        {
          provide: CreateOccupationUseCase,
          useValue: mockCreateOccupationService,
        },
        {
          provide: UpdateOccupationUseCase,
          useValue: mockUpdateOccupationService,
        },
        {
          provide: DeleteOccupationUseCase,
          useValue: mockDeleteOccupationService,
        },
      ],
    }).compile()

    controller = module.get<OccupationController>(OccupationController)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should delegate to GetOccupationsUseCase with query', async () => {
      const query: OccupationQueryDto = { page: 1, limit: 10 }
      const expected = {
        data: [{ id: 'occ-1', name: 'Wiraswasta' }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }
      mockGetOccupationsService.execute.mockResolvedValue(expected)

      const result = await controller.findAll(query)

      expect(mockGetOccupationsService.execute).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
        search: query.search,
        isActive: query.isActive,
      })
      expect(result).toEqual(expected)
    })
  })

  describe('findOne', () => {
    it('should delegate to GetOccupationByIdUseCase with id', async () => {
      const id = 'occ-1'
      const expected = { id: 'occ-1', name: 'Wiraswasta' }
      mockGetOccupationByIdService.execute.mockResolvedValue(expected)

      const result = await controller.findOne(id)

      expect(mockGetOccupationByIdService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual(expected)
    })
  })

  describe('create', () => {
    it('should delegate to CreateOccupationUseCase with dto', async () => {
      const dto: CreateOccupationDto = { name: 'Wiraswasta' }
      const expected = { id: 'occ-new', ...dto }
      mockCreateOccupationService.execute.mockResolvedValue(expected)

      const result = await controller.create(dto)

      expect(mockCreateOccupationService.execute).toHaveBeenCalledWith({
        name: dto.name,
        isActive: dto.isActive,
      })
      expect(result).toEqual(expected)
    })
  })

  describe('update', () => {
    it('should delegate to UpdateOccupationUseCase with id and dto', async () => {
      const id = 'occ-1'
      const dto: UpdateOccupationDto = { name: 'PNS' }
      const expected = { id: 'occ-1', name: 'PNS' }
      mockUpdateOccupationService.execute.mockResolvedValue(expected)

      const result = await controller.update(id, dto)

      expect(mockUpdateOccupationService.execute).toHaveBeenCalledWith(id, {
        name: dto.name,
        isActive: dto.isActive,
      })
      expect(result).toEqual(expected)
    })
  })

  describe('remove', () => {
    it('should delegate to DeleteOccupationUseCase with id', async () => {
      const id = 'occ-1'
      mockDeleteOccupationService.execute.mockResolvedValue(undefined)

      await controller.remove(id)

      expect(mockDeleteOccupationService.execute).toHaveBeenCalledWith(id)
    })
  })
})
