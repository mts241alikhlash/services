import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IAssessmentWeightRepository } from '../../../domain/repositories/assessment-weight.repository.js'
import type { ReplaceAssessmentWeightsInput } from './replace-assessment-weights.input.js'
import { ReplaceAssessmentWeightsUseCase } from './replace-assessment-weights.use-case.js'

describe('ReplaceAssessmentWeightsUseCase', () => {
  let useCase: ReplaceAssessmentWeightsUseCase

  const mockWeightRepository = {
    findByTeachingAssignment: jest.fn(),
    replaceForTeachingAssignment: jest.fn(),
  }
  const mockTeachingAssignmentRepository = {
    teachingAssignmentExists: jest.fn(),
  }

  function input(
    weights: { type: string; weight: number }[],
  ): ReplaceAssessmentWeightsInput {
    return {
      teachingAssignmentId: 'ta-1',
      weights,
    } as ReplaceAssessmentWeightsInput
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplaceAssessmentWeightsUseCase,
        {
          provide: IAssessmentWeightRepository,
          useValue: mockWeightRepository,
        },
        {
          provide: IAcademicLookupPort,
          useValue: mockTeachingAssignmentRepository,
        },
      ],
    }).compile()

    useCase = module.get(ReplaceAssessmentWeightsUseCase)
    jest.clearAllMocks()

    mockTeachingAssignmentRepository.teachingAssignmentExists.mockResolvedValue(
      true,
    )
    mockWeightRepository.replaceForTeachingAssignment.mockImplementation(
      (input: { weights: unknown }) => Promise.resolve(input.weights),
    )
  })

  it('stores a set that totals 100', async () => {
    await useCase.execute(
      input([
        { type: 'DAILY', weight: 40 },
        { type: 'MIDTERM', weight: 30 },
        { type: 'FINAL', weight: 30 },
      ]),
    )

    expect(
      mockWeightRepository.replaceForTeachingAssignment,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ teachingAssignmentId: 'ta-1' }),
    )
  })

  it.each([[99], [101], [0]])('rejects a set totalling %s', async (midterm) => {
    await expect(
      useCase.execute(
        input([
          { type: 'DAILY', weight: 0 },
          { type: 'MIDTERM', weight: midterm },
        ]),
      ),
    ).rejects.toThrow(BadRequestException)
    expect(
      mockWeightRepository.replaceForTeachingAssignment,
    ).not.toHaveBeenCalled()
  })

  it('accepts a total that rounds to 100 across thirds', async () => {
    await expect(
      useCase.execute(
        input([
          { type: 'DAILY', weight: 33.33 },
          { type: 'MIDTERM', weight: 33.33 },
          { type: 'FINAL', weight: 33.34 },
        ]),
      ),
    ).resolves.toBeDefined()
  })

  it('rejects the same type listed twice', async () => {
    await expect(
      useCase.execute(
        input([
          { type: 'DAILY', weight: 50 },
          { type: 'DAILY', weight: 50 },
        ]),
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it('does not store types weighted at zero', async () => {
    await useCase.execute(
      input([
        { type: 'DAILY', weight: 100 },
        { type: 'PRACTICAL', weight: 0 },
      ]),
    )

    const { weights } =
      mockWeightRepository.replaceForTeachingAssignment.mock.calls[0][0]
    expect(weights).toEqual([{ type: 'DAILY', weight: 100 }])
  })

  it('rejects an unknown teaching assignment', async () => {
    mockTeachingAssignmentRepository.teachingAssignmentExists.mockResolvedValue(
      false,
    )

    await expect(
      useCase.execute(input([{ type: 'DAILY', weight: 100 }])),
    ).rejects.toThrow(NotFoundException)
  })
})
