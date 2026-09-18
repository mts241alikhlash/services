import { Test, TestingModule } from '@nestjs/testing'
import { IClassroomSupervisorRepository } from '../../../domain/repositories/classroom-supervisor.repository.js'
import type { GetClassroomSupervisorsInput } from './get-classroom-supervisors.input.js'
import { GetClassroomSupervisorsUseCase } from './get-classroom-supervisors.use-case.js'

describe('GetClassroomSupervisorsUseCase', () => {
  let useCase: GetClassroomSupervisorsUseCase

  const mockRepo = {
    findAll: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetClassroomSupervisorsUseCase,
        { provide: IClassroomSupervisorRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<GetClassroomSupervisorsUseCase>(
      GetClassroomSupervisorsUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: GetClassroomSupervisorsInput = { page: 1, limit: 10 }

    it('should return paginated data with meta', async () => {
      const mockData = [{ id: 'sup-1' }, { id: 'sup-2' }]
      mockRepo.findAll.mockResolvedValue({
        data: mockData,
        total: 2,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(input)

      expect(mockRepo.findAll).toHaveBeenCalledWith(input)
      expect(result).toEqual({
        data: mockData,
        meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      })
    })

    it('should calculate totalPages correctly for multiple pages', async () => {
      mockRepo.findAll.mockResolvedValue({
        data: [],
        total: 25,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(input)

      expect(result.meta.totalPages).toBe(3)
    })

    it('should return zero totalPages when no records', async () => {
      mockRepo.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(input)

      expect(result.meta.total).toBe(0)
      expect(result.meta.totalPages).toBe(0)
    })
  })
})
