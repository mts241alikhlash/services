import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IStudentScoreRepository } from '../../../../assessment/domain/repositories/student-score.repository.js'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import { GenerateReportCardUseCase } from './generate-report-card.use-case.js'
import type { GenerateReportCardInput } from './generate-report-card.input.js'

function scoreRow(options: {
  score: number | null
  type?: string
  weight?: number
  maxScore?: number
  subjectId?: string
  subjectName?: string
  gradeId?: string
  assignmentPassingScore?: number | null
  typeWeights?: { type: string; weight: number }[]
}) {
  return {
    score: options.score,
    assessmentItem: {
      type: options.type ?? 'DAILY',
      weight: options.weight ?? 1,
      maxScore: options.maxScore ?? 100,
      teachingAssignment: {
        id: 'ta-1',
        passingScore: options.assignmentPassingScore ?? null,
        subject: {
          id: options.subjectId ?? 'subj-1',
          name: options.subjectName ?? 'Matematika',
          code: 'MTK',
        },
        classroom: {
          gradeId: options.gradeId ?? 'grade-7',
          academicYearId: 'ay-1',
        },
        assessmentWeights: options.typeWeights ?? [
          { type: 'DAILY', weight: 100 },
        ],
      },
    },
  }
}

describe('GenerateReportCardUseCase', () => {
  let useCase: GenerateReportCardUseCase

  const mockRepo = {
    upsert: jest.fn(),
    findByEnrollmentId: jest.fn(),
    calculateAndApplyClassroomRanks: jest.fn(),
  }
  const mockScoreRepository = { findAllForReportCard: jest.fn() }
  const mockEnrollmentRepository = { findSummary: jest.fn() }
  const mockAcademicLookup = {
    findSetting: jest
      .fn()
      .mockResolvedValue({ defaultPassingScore: 75, weeklyHolidays: [] }),
    findPassingScores: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateReportCardUseCase,
        { provide: IReportCardRepository, useValue: mockRepo },
        { provide: IStudentScoreRepository, useValue: mockScoreRepository },
        { provide: IEnrollmentLookupPort, useValue: mockEnrollmentRepository },
        { provide: IAcademicLookupPort, useValue: mockAcademicLookup },
      ],
    }).compile()

    useCase = module.get<GenerateReportCardUseCase>(GenerateReportCardUseCase)
    jest.clearAllMocks()

    mockEnrollmentRepository.findSummary.mockResolvedValue({ id: 'enr-1' })
    mockRepo.findByEnrollmentId.mockResolvedValue(null)
    mockAcademicLookup.findPassingScores.mockResolvedValue([])
    mockRepo.upsert.mockImplementation((input: unknown) =>
      Promise.resolve({ id: 'rap-1', ...(input as object) }),
    )
  })

  const input: GenerateReportCardInput = { enrollmentId: 'enr-1' }

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('scores each assessment against its own maximum', async () => {
      mockScoreRepository.findAllForReportCard.mockResolvedValue([
        scoreRow({ score: 20, maxScore: 25 }),
        scoreRow({ score: 80, maxScore: 100 }),
      ])

      await useCase.execute(input)

      expect(mockRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ totalAverage: 80 }),
      )
    })

    it('applies the employee per-type weights', async () => {
      const typeWeights = [
        { type: 'DAILY', weight: 40 },
        { type: 'MIDTERM', weight: 30 },
        { type: 'FINAL', weight: 30 },
      ]
      mockScoreRepository.findAllForReportCard.mockResolvedValue([
        scoreRow({ score: 80, type: 'DAILY', typeWeights }),
        scoreRow({ score: 60, type: 'MIDTERM', typeWeights }),
        scoreRow({ score: 90, type: 'FINAL', typeWeights }),
      ])

      await useCase.execute(input)

      expect(mockRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ totalAverage: 77 }),
      )
    })

    it('averages the subjects rather than every assessment', async () => {
      mockScoreRepository.findAllForReportCard.mockResolvedValue([
        scoreRow({ score: 60, subjectId: 'subj-1', subjectName: 'MTK' }),
        scoreRow({ score: 60, subjectId: 'subj-1', subjectName: 'MTK' }),
        scoreRow({ score: 60, subjectId: 'subj-1', subjectName: 'MTK' }),
        scoreRow({ score: 90, subjectId: 'subj-2', subjectName: 'IPA' }),
      ])

      await useCase.execute(input)

      expect(mockRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ totalAverage: 75 }),
      )
    })

    it('stores a line per subject with the passing score it was judged against', async () => {
      mockScoreRepository.findAllForReportCard.mockResolvedValue([
        scoreRow({ score: 72, subjectId: 'subj-1' }),
        scoreRow({
          score: 72,
          subjectId: 'subj-2',
          subjectName: 'IPA',
          assignmentPassingScore: 80,
        }),
      ])
      mockAcademicLookup.findPassingScores.mockResolvedValue([
        {
          gradeId: 'grade-7',
          academicYearId: 'ay-1',
          subjectId: 'subj-1',
          passingScore: 70,
        },
      ])

      await useCase.execute(input)

      const { subjects } = mockRepo.upsert.mock.calls[0][0]
      expect(subjects).toEqual([
        expect.objectContaining({
          subjectId: 'subj-1',
          passingScore: 70,
          isComplete: true,
        }),
        expect.objectContaining({
          subjectId: 'subj-2',
          passingScore: 80,
          isComplete: false,
        }),
      ])
    })

    it('ignores an assessment that has not been marked', async () => {
      mockScoreRepository.findAllForReportCard.mockResolvedValue([
        scoreRow({ score: null }),
        scoreRow({ score: 90 }),
      ])

      await useCase.execute(input)

      expect(mockRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ totalAverage: 90 }),
      )
    })

    it('should handle empty scores with null average', async () => {
      mockScoreRepository.findAllForReportCard.mockResolvedValue([])

      const result = await useCase.execute(input)

      expect(mockRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ totalAverage: null, subjects: [] }),
      )
      expect(result.totalAverage).toBeNull()
    })

    it('refuses to regenerate a published report card', async () => {
      mockRepo.findByEnrollmentId.mockResolvedValue({
        id: 'rap-1',
        isPublished: true,
      })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepo.upsert).not.toHaveBeenCalled()
    })

    it('regenerates one that is still a draft', async () => {
      mockRepo.findByEnrollmentId.mockResolvedValue({
        id: 'rap-1',
        isPublished: false,
      })
      mockScoreRepository.findAllForReportCard.mockResolvedValue([
        scoreRow({ score: 90 }),
      ])

      await expect(useCase.execute(input)).resolves.toBeDefined()
      expect(mockRepo.upsert).toHaveBeenCalled()
    })

    it('should throw NotFoundException when enrollment not found', async () => {
      mockEnrollmentRepository.findSummary.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
    })
  })
})
