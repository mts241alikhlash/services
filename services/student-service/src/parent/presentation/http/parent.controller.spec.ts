import { Test, TestingModule } from '@nestjs/testing'
import { CreateParentDto } from './dto/request/create-parent.dto.js'
import { ParentQueryDto } from './dto/request/parent-query.dto.js'
import { UpdateParentDto } from './dto/request/update-parent.dto.js'
import { CreateParentUseCase } from '../../application/use-cases/create-parent/create-parent.use-case.js'
import { DeleteParentUseCase } from '../../application/use-cases/delete-parent/delete-parent.use-case.js'
import { GetParentByIdUseCase } from '../../application/use-cases/get-parent-by-id/get-parent-by-id.use-case.js'
import { GetParentsUseCase } from '../../application/use-cases/get-parents/get-parents.use-case.js'
import { UpdateParentUseCase } from '../../application/use-cases/update-parent/update-parent.use-case.js'
import { ParentController } from './parent.controller.js'

describe('ParentController', () => {
  let controller: ParentController

  const mockGetParentsService = { execute: jest.fn() }
  const mockGetParentByIdService = { execute: jest.fn() }
  const mockCreateParentService = { execute: jest.fn() }
  const mockUpdateParentService = { execute: jest.fn() }
  const mockDeleteParentService = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParentController],
      providers: [
        { provide: GetParentsUseCase, useValue: mockGetParentsService },
        { provide: GetParentByIdUseCase, useValue: mockGetParentByIdService },
        { provide: CreateParentUseCase, useValue: mockCreateParentService },
        { provide: UpdateParentUseCase, useValue: mockUpdateParentService },
        { provide: DeleteParentUseCase, useValue: mockDeleteParentService },
      ],
    }).compile()

    controller = module.get<ParentController>(ParentController)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should delegate to GetParentsUseCase with query', async () => {
      const query: ParentQueryDto = { page: 1, limit: 10 }
      const expected = {
        data: [{ id: 'par-1', name: 'Budi Santoso' }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }
      mockGetParentsService.execute.mockResolvedValue(expected)

      const result = await controller.findAll(query)

      expect(mockGetParentsService.execute).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
        search: query.search,
        occupationId: query.occupationId,
      })
      expect(result).toEqual(expected)
    })
  })

  describe('findOne', () => {
    it('should delegate to GetParentByIdUseCase with id', async () => {
      const id = 'par-1'
      const expected = { id: 'par-1', name: 'Budi Santoso' }
      mockGetParentByIdService.execute.mockResolvedValue(expected)

      const result = await controller.findOne(id)

      expect(mockGetParentByIdService.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual(expected)
    })
  })

  describe('create', () => {
    it('should delegate to CreateParentUseCase with dto', async () => {
      const dto: CreateParentDto = {
        name: 'Budi Santoso',
        nik: '3578010101700001',
        birthPlace: 'Surabaya',
        birthDate: '1970-01-01',
        occupationId: '550e8400-e29b-41d4-a716-446655440012',
      }
      const expected = { id: 'par-new', ...dto }
      mockCreateParentService.execute.mockResolvedValue(expected)

      const result = await controller.create(dto)

      expect(mockCreateParentService.execute).toHaveBeenCalledWith({
        name: dto.name,
        nik: dto.nik,
        birthPlace: dto.birthPlace,
        birthDate: dto.birthDate,
        email: dto.email,
        phone: dto.phone,
        occupationId: dto.occupationId,
        income: dto.income,
      })
      expect(result).toEqual(expected)
    })
  })

  describe('update', () => {
    it('should delegate to UpdateParentUseCase with id and dto', async () => {
      const id = 'par-1'
      const dto: UpdateParentDto = { name: 'Budi Updated' }
      const expected = { id: 'par-1', name: 'Budi Updated' }
      mockUpdateParentService.execute.mockResolvedValue(expected)

      const result = await controller.update(id, dto)

      expect(mockUpdateParentService.execute).toHaveBeenCalledWith(id, {
        name: dto.name,
        nik: dto.nik,
        birthPlace: dto.birthPlace,
        birthDate: dto.birthDate,
        email: dto.email,
        phone: dto.phone,
        occupationId: dto.occupationId,
        income: dto.income,
      })
      expect(result).toEqual(expected)
    })
  })

  describe('remove', () => {
    it('should delegate to DeleteParentUseCase with id', async () => {
      const id = 'par-1'
      mockDeleteParentService.execute.mockResolvedValue(undefined)

      await controller.remove(id)

      expect(mockDeleteParentService.execute).toHaveBeenCalledWith(id)
    })
  })
})
