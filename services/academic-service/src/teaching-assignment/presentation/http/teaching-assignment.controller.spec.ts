import { Test, TestingModule } from '@nestjs/testing'
import { CreateTeachingAssignmentDto } from './dto/request/create-teaching-assignment.dto.js'
import { UpdateTeachingAssignmentDto } from './dto/request/update-teaching-assignment.dto.js'
import { CreateTeachingAssignmentUseCase } from '../../application/use-cases/create-teaching-assignment/create-teaching-assignment.use-case.js'
import { DeleteTeachingAssignmentUseCase } from '../../application/use-cases/delete-teaching-assignment/delete-teaching-assignment.use-case.js'
import { GetTeachingAssignmentByIdUseCase } from '../../application/use-cases/get-teaching-assignment-by-id/get-teaching-assignment-by-id.use-case.js'
import { GetTeachingAssignmentsUseCase } from '../../application/use-cases/get-teaching-assignments/get-teaching-assignments.use-case.js'
import { GetMyTeachingAssignmentsUseCase } from '../../application/use-cases/get-my-teaching-assignments/get-my-teaching-assignments.use-case.js'
import { UpdateTeachingAssignmentUseCase } from '../../application/use-cases/update-teaching-assignment/update-teaching-assignment.use-case.js'
import { TeachingAssignmentController } from './teaching-assignment.controller.js'

describe('TeachingAssignmentController', () => {
  let controller: TeachingAssignmentController
  const mockGetAll = { execute: jest.fn() }
  const mockGetMine = { execute: jest.fn() }
  const mockGetById = { execute: jest.fn() }
  const mockCreate = { execute: jest.fn() }
  const mockUpdate = { execute: jest.fn() }
  const mockDelete = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachingAssignmentController],
      providers: [
        { provide: GetTeachingAssignmentsUseCase, useValue: mockGetAll },
        {
          provide: GetMyTeachingAssignmentsUseCase,
          useValue: mockGetMine,
        },
        { provide: GetTeachingAssignmentByIdUseCase, useValue: mockGetById },
        { provide: CreateTeachingAssignmentUseCase, useValue: mockCreate },
        { provide: UpdateTeachingAssignmentUseCase, useValue: mockUpdate },
        { provide: DeleteTeachingAssignmentUseCase, useValue: mockDelete },
      ],
    }).compile()
    controller = module.get<TeachingAssignmentController>(
      TeachingAssignmentController,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should delegate', async () => {
      mockGetAll.execute.mockResolvedValue({ data: [] })
      const result = await controller.findAll({ page: 1, limit: 10 })
      expect(mockGetAll.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      })
      expect(result).toEqual({ data: [] })
    })
  })

  describe('findOne', () => {
    it('should delegate', async () => {
      mockGetById.execute.mockResolvedValue({ id: 'ta-1' })
      const result = await controller.findOne('ta-1')
      expect(mockGetById.execute).toHaveBeenCalledWith('ta-1')
      expect(result).toEqual({ id: 'ta-1' })
    })
  })

  describe('create', () => {
    it('should delegate', async () => {
      const dto: CreateTeachingAssignmentDto = {
        employeeId: 'emp-1',
        classroomIds: ['cls-1'],
        subjectId: 'sub-1',
        semesterId: 'sem-1',
      }
      mockCreate.execute.mockResolvedValue({ id: 'new' })
      await controller.create(dto)
      expect(mockCreate.execute).toHaveBeenCalledWith(dto)
    })
  })

  describe('update', () => {
    it('should delegate', async () => {
      const dto: UpdateTeachingAssignmentDto = { employeeId: 'emp-2' }
      mockUpdate.execute.mockResolvedValue({ id: 'ta-1' })
      await controller.update('ta-1', dto)
      expect(mockUpdate.execute).toHaveBeenCalledWith('ta-1', dto)
    })
  })

  describe('remove', () => {
    it('should delegate', async () => {
      mockDelete.execute.mockResolvedValue(undefined)
      await controller.remove('ta-1')
      expect(mockDelete.execute).toHaveBeenCalledWith('ta-1')
    })
  })
})
