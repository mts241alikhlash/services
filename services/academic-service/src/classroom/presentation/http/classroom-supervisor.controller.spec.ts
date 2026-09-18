import { Test, TestingModule } from '@nestjs/testing'
import { ClassroomSupervisorQueryDto } from './dto/request/classroom-supervisor-query.dto.js'
import { CreateClassroomSupervisorDto } from './dto/request/create-classroom-supervisor.dto.js'
import { UpdateClassroomSupervisorDto } from './dto/request/update-classroom-supervisor.dto.js'
import { CreateClassroomSupervisorUseCase } from '../../application/use-cases/create-classroom-supervisor/create-classroom-supervisor.use-case.js'
import { DeleteClassroomSupervisorUseCase } from '../../application/use-cases/delete-classroom-supervisor/delete-classroom-supervisor.use-case.js'
import { GetClassroomSupervisorByIdUseCase } from '../../application/use-cases/get-classroom-supervisor-by-id/get-classroom-supervisor-by-id.use-case.js'
import { GetClassroomSupervisorsUseCase } from '../../application/use-cases/get-classroom-supervisors/get-classroom-supervisors.use-case.js'
import { UpdateClassroomSupervisorUseCase } from '../../application/use-cases/update-classroom-supervisor/update-classroom-supervisor.use-case.js'
import { ClassroomSupervisorController } from './classroom-supervisor.controller.js'

describe('ClassroomSupervisorController', () => {
  let controller: ClassroomSupervisorController

  const mockGetAll = { execute: jest.fn() }
  const mockGetById = { execute: jest.fn() }
  const mockCreate = { execute: jest.fn() }
  const mockUpdate = { execute: jest.fn() }
  const mockDelete = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassroomSupervisorController],
      providers: [
        { provide: GetClassroomSupervisorsUseCase, useValue: mockGetAll },
        { provide: GetClassroomSupervisorByIdUseCase, useValue: mockGetById },
        { provide: CreateClassroomSupervisorUseCase, useValue: mockCreate },
        { provide: UpdateClassroomSupervisorUseCase, useValue: mockUpdate },
        { provide: DeleteClassroomSupervisorUseCase, useValue: mockDelete },
      ],
    }).compile()

    controller = module.get<ClassroomSupervisorController>(
      ClassroomSupervisorController,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should delegate to GetClassroomSupervisorsUseCase', async () => {
      const query: ClassroomSupervisorQueryDto = { page: 1, limit: 10 }
      mockGetAll.execute.mockResolvedValue({ data: [] })
      const result = await controller.findAll(query)
      expect(mockGetAll.execute).toHaveBeenCalled()
      expect(result).toEqual({ data: [] })
    })
  })

  describe('findOne', () => {
    it('should delegate to GetClassroomSupervisorByIdUseCase', async () => {
      mockGetById.execute.mockResolvedValue({ id: 'csup-1' })
      const result = await controller.findOne('csup-1')
      expect(mockGetById.execute).toHaveBeenCalledWith('csup-1')
      expect(result).toEqual({ id: 'csup-1' })
    })
  })

  describe('create', () => {
    it('should delegate to CreateClassroomSupervisorUseCase', async () => {
      const dto: CreateClassroomSupervisorDto = {
        employeeId: 'emp-1',
        classroomId: 'cls-1',
        semesterId: 'sem-1',
      }
      mockCreate.execute.mockResolvedValue({ id: 'new' })
      await controller.create(dto)
      expect(mockCreate.execute).toHaveBeenCalledWith(dto)
    })
  })

  describe('update', () => {
    it('should delegate to UpdateClassroomSupervisorUseCase', async () => {
      const dto: UpdateClassroomSupervisorDto = { employeeId: 'emp-2' }
      mockUpdate.execute.mockResolvedValue({ id: 'csup-1' })
      await controller.update('csup-1', dto)
      expect(mockUpdate.execute).toHaveBeenCalledWith('csup-1', dto)
    })
  })

  describe('remove', () => {
    it('should delegate to DeleteClassroomSupervisorUseCase', async () => {
      mockDelete.execute.mockResolvedValue(undefined)
      await controller.remove('csup-1')
      expect(mockDelete.execute).toHaveBeenCalledWith('csup-1')
    })
  })
})
