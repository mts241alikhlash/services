import { Injectable, Logger } from '@nestjs/common'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IExamSessionRepository } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import {
  IScorePublisherPort,
  type ExamScorePayload,
} from '../../../../platform/score-publisher/score-publisher.port.js'
import {
  IScorePublicationRepository,
  type PublicationCandidate,
} from '../../../domain/repositories/score-publication.repository.js'

export const PUBLISH_BATCH = 50
const MAX_ROUNDS = 20

export const publicationWaitMs = (attempts: number): number =>
  Math.min(2 ** attempts, 60) * 60_000

class Unpublishable extends Error {}

@Injectable()
export class PublishScoresUseCase {
  private readonly logger = new Logger(PublishScoresUseCase.name)

  constructor(
    private readonly publications: IScorePublicationRepository,
    private readonly sessions: IExamSessionRepository,
    private readonly schedules: IExamScheduleRepository,
    private readonly enrollments: IEnrollmentLookupPort,
    private readonly academic: IAcademicLookupPort,
    private readonly publisher: IScorePublisherPort,
  ) {}

  async execute(now: Date = new Date()): Promise<number> {
    const seen: string[] = []
    let attempted = 0
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const batch = await this.publications.findCandidates(PUBLISH_BATCH, seen)
      for (const candidate of batch) {
        seen.push(candidate.sessionId)
        if (!this.isDue(candidate, now)) continue
        attempted += 1
        await this.publishOne(candidate.sessionId, now)
      }
      if (batch.length < PUBLISH_BATCH) break
    }
    return attempted
  }

  private isDue(candidate: PublicationCandidate, now: Date): boolean {
    return (
      candidate.lastAttemptAt === null ||
      now.getTime() - candidate.lastAttemptAt.getTime() >=
        publicationWaitMs(candidate.attempts)
    )
  }

  private async publishOne(sessionId: string, now: Date): Promise<void> {
    try {
      const payload = await this.payloadOf(sessionId, now)
      const outcome = await this.publisher.publish(payload)
      if (outcome.result === 'SENT') {
        await this.publications.markSent(sessionId, now)
      } else {
        await this.publications.markFailed(sessionId, now, outcome.reason)
      }
    } catch (error) {
      const reason =
        error instanceof Unpublishable
          ? error.message
          : 'Data nilai tidak bisa dilengkapi, coba lagi nanti'
      if (!(error instanceof Unpublishable)) {
        this.logger.error(
          `Score of session ${sessionId} could not be prepared`,
          error instanceof Error ? error.stack : String(error),
        )
      }
      await this.publications.markFailed(sessionId, now, reason)
    }
  }

  private async payloadOf(
    sessionId: string,
    now: Date,
  ): Promise<ExamScorePayload> {
    const session = await this.sessions.findById(sessionId)
    if (session === null) throw new Unpublishable('Sesi ujian tidak ditemukan')
    const schedule = await this.schedules.findById(session.scheduleId)
    if (schedule === null)
      throw new Unpublishable('Jadwal ujian tidak ditemukan')

    const enrollment = await this.enrollments.findActiveByStudent(
      session.studentId,
      schedule.semesterId,
    )
    if (enrollment === null) {
      throw new Unpublishable(
        'Pendaftaran siswa di semester ini tidak ditemukan',
      )
    }
    const [classroom] = await this.academic.classroomsByIds([
      schedule.classroomId,
    ])
    if (classroom === undefined)
      throw new Unpublishable('Kelas tidak ditemukan')

    const rawScore = session.rawScore ?? 0
    const maxScore = session.maxScore ?? 0
    return {
      examSessionId: session.id,
      enrollmentId: enrollment.id,
      studentId: session.studentId,
      subjectId: schedule.subjectId,
      gradeId: classroom.gradeId,
      classroomId: schedule.classroomId,
      semesterId: schedule.semesterId,
      examTitle: schedule.packageTitle,
      rawScore,
      maxScore,
      score: maxScore > 0 ? Math.round((rawScore / maxScore) * 10000) / 100 : 0,
      gradedAt: (session.gradedAt ?? now).toISOString(),
    }
  }
}
