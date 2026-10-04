import { Test, TestingModule } from '@nestjs/testing'
import { RolloverSemesterDto } from './dto/request/rollover-semester.dto.js'
import { RolloverSemesterUseCase } from '../../application/use-cases/rollover-semester/rollover-semester.use-case.js'
import { SemesterRolloverController } from './semester-rollover.controller.js'

describe('SemesterRolloverController', () => {
  let controller: SemesterRolloverController

  const mockRolloverSemesterService = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemesterRolloverController],
      providers: [
        {
          provide: RolloverSemesterUseCase,
          useValue: mockRolloverSemesterService,
        },
      ],
    }).compile()

    controller = module.get<SemesterRolloverController>(
      SemesterRolloverController,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('rollover', () => {
    it('should delegate to RolloverSemesterUseCase and map the result', async () => {
      const dto: RolloverSemesterDto = {
        sourceSemesterId: 'sem-1',
        targetSemesterId: 'sem-2',
      }
      const emptyCategory = { created: 0, skipped: 0 }
      mockRolloverSemesterService.execute.mockResolvedValue({
        classrooms: emptyCategory,
        enrollments: emptyCategory,
        supervisors: emptyCategory,
        teachingAssignments: emptyCategory,
        schedules: emptyCategory,
      })

      const result = await controller.rollover(dto)

      expect(mockRolloverSemesterService.execute).toHaveBeenCalledWith({
        sourceSemesterId: 'sem-1',
        targetSemesterId: 'sem-2',
      })
      expect(result.classrooms).toEqual(emptyCategory)
    })
  })
})
