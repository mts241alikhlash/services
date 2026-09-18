import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { AssessmentType } from '@prisma/client'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import {
  IStudentScoreRepository,
  ReportCardScoreRow,
} from '../../../../assessment/domain/repositories/student-score.repository.js'
import {
  IAcademicLookupPort,
  type PassingScoreQuery,
} from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { DEFAULT_PASSING_SCORE } from '../../../constants/report-card.constants.js'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import {
  calculateSubjectGrades,
  calculateTotalAverage,
  type ScoredAssessment,
  type SubjectGradeInput,
} from '../../services/calculate-subject-grades.js'
import type { GenerateReportCardInput } from './generate-report-card.input.js'

@Injectable()
export class GenerateReportCardUseCase {
  private readonly logger = new Logger(GenerateReportCardUseCase.name)

  constructor(
    private readonly reportCardRepository: IReportCardRepository,
    private readonly studentScoreRepository: IStudentScoreRepository,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
  ) {}

  private async resolvePassingScores(
    scores: ReportCardScoreRow[],
  ): Promise<Map<string, number>> {
    const queries = new Map<string, PassingScoreQuery>()

    for (const row of scores) {
      const assignment = row.assessmentItem.teachingAssignment
      if (
        assignment.passingScore !== null &&
        assignment.passingScore !== undefined
      ) {
        continue
      }
      const query: PassingScoreQuery = {
        gradeId: assignment.classroom.gradeId,
        academicYearId: assignment.classroom.academicYearId,
        subjectId: assignment.subject.id,
      }
      queries.set(
        `${query.gradeId}:${query.academicYearId}:${query.subjectId}`,
        query,
      )
    }

    const resolved = await this.academicLookup.findPassingScores([
      ...queries.values(),
    ])

    return new Map(
      resolved.map((row) => [
        `${row.gradeId}:${row.academicYearId}:${row.subjectId}`,
        row.passingScore,
      ]),
    )
  }

  private groupBySubject(
    scores: ReportCardScoreRow[],
    curriculumPassingScores: Map<string, number>,
    defaultPassingScore: number,
  ): SubjectGradeInput[] {
    const bySubject = new Map<string, SubjectGradeInput>()

    for (const row of scores) {
      if (row.score === null || row.score === undefined) continue

      const item = row.assessmentItem
      const assignment = item.teachingAssignment
      const subject = assignment.subject

      let entry = bySubject.get(subject.id)
      if (!entry) {
        const typeWeights: Partial<Record<AssessmentType, number>> = {}
        for (const weight of assignment.assessmentWeights) {
          typeWeights[weight.type] = weight.weight
        }

        entry = {
          subjectId: subject.id,
          subjectCode: subject.code ?? null,
          subjectName: subject.name,
          passingScore:
            assignment.passingScore ??
            curriculumPassingScores.get(
              `${assignment.classroom.gradeId}:${assignment.classroom.academicYearId}:${subject.id}`,
            ) ??
            defaultPassingScore,
          typeWeights,
          assessments: [],
        }
        bySubject.set(subject.id, entry)
      }

      const assessment: ScoredAssessment = {
        type: item.type,
        itemWeight: item.weight ?? 1,
        maxScore: item.maxScore ?? 100,
        score: row.score,
      }
      entry.assessments.push(assessment)
    }

    return [...bySubject.values()]
  }

  async execute(input: GenerateReportCardInput) {
    const enrollmentId = input.enrollmentId ?? input.studentEnrollmentId ?? ''
    const enrollment = await this.enrollmentLookup.findSummary(enrollmentId)
    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      )
    }

    const existing =
      await this.reportCardRepository.findByEnrollmentId(enrollmentId)
    if (existing?.isPublished) {
      throw new ConflictException(
        'Report card is already published and cannot be regenerated. Unpublish it first.',
      )
    }

    const scores =
      await this.studentScoreRepository.findAllForReportCard(enrollmentId)

    const setting = await this.academicLookup.findSetting()
    const defaultPassingScore =
      setting?.defaultPassingScore ?? DEFAULT_PASSING_SCORE

    const curriculumPassingScores = await this.resolvePassingScores(scores)
    const rows = calculateSubjectGrades(
      this.groupBySubject(scores, curriculumPassingScores, defaultPassingScore),
    )
    const totalAverage = calculateTotalAverage(rows)

    let calculatedRank = input.rank ?? null

    let reportCard = await this.reportCardRepository.upsert({
      enrollmentId,
      totalAverage,
      rank: calculatedRank,
      employeeNote: input.employeeNote ?? null,
      isPublished: input.isPublished ?? false,
      subjects: rows.map((row) => ({
        subjectId: row.subjectId,
        subjectCode: row.code || null,
        subjectName: row.name,
        score: row.scoreValue,
        passingScore: row.passingScore,
        predicate: row.predicate,
        description: row.description,
        isComplete: row.isComplete,
      })),
    })

    if (input.rank === undefined && totalAverage !== null) {
      const classroomId = enrollment.classroomId
      const semesterId = enrollment.semesterId

      if (classroomId && semesterId) {
        calculatedRank =
          await this.reportCardRepository.calculateAndApplyClassroomRanks(
            classroomId,
            semesterId,
            enrollmentId,
          )

        if (calculatedRank !== null) {
          reportCard = { ...reportCard, rank: calculatedRank }
        }
      }
    }

    this.logger.log(
      `ReportCard generated for enrollment ${enrollmentId} — Subjects: ${rows.length}, Avg: ${totalAverage?.toFixed(2) ?? '-'}, Rank: ${calculatedRank ?? '-'}`,
    )

    return reportCard
  }
}
