import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import type {
  BulkStudentScoreRecord,
  StudentScoreRosterItem,
} from '../../../domain/repositories/student-score.repository.js'

export async function buildScoreRoster(
  prisma: PrismaService,
  enrollmentLookup: IEnrollmentLookupPort,
  assessmentItemId: string,
  classroomId?: string,
  semesterId?: string,
): Promise<StudentScoreRosterItem[]> {
  const enrollments = await enrollmentLookup.search({
    classroomId,
    semesterId,
  })
  if (enrollments.length === 0) return []

  const scores = await prisma.studentScore.findMany({
    where: {
      assessmentItemId,
      deletedAt: null,
      enrollmentId: { in: enrollments.map((enrolment) => enrolment.id) },
    },
  })
  const scoreMap = new Map(scores.map((score) => [score.enrollmentId, score]))

  return enrollments
    .map((enrolment) => {
      const score = scoreMap.get(enrolment.id)
      return {
        enrollmentId: enrolment.id,
        nis: enrolment.studentNis ?? '',
        studentName: enrolment.studentName ?? '-',
        scoreId: score?.id ?? null,
        score: score?.score ?? null,
        note: score?.note ?? null,
      }
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName))
}

export async function upsertScores(
  prisma: PrismaService,
  assessmentItemId: string,
  records: BulkStudentScoreRecord[],
  correctedById: string | null = null,
): Promise<{ saved: number }> {
  const results = await prisma.$transaction(
    records.map((record) =>
      prisma.studentScore.upsert({
        where: {
          enrollmentId_assessmentItemId: {
            enrollmentId: record.enrollmentId,
            assessmentItemId,
          },
        },
        update: {
          score: record.score,
          note: record.note,
          deletedAt: null,
          correctedById,
          correctedAt: correctedById ? new Date() : null,
        },
        create: {
          enrollmentId: record.enrollmentId,
          assessmentItemId,
          score: record.score,
          note: record.note,
          correctedById,
          correctedAt: correctedById ? new Date() : null,
        },
      }),
    ),
  )
  return { saved: results.length }
}
