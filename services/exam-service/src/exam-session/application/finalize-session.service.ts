import { Injectable, NotFoundException } from '@nestjs/common'
import { IExamPackageRepository } from '../../exam-package/domain/repositories/exam-package.repository.js'
import { IExamScheduleRepository } from '../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IQuestionRepository } from '../../question/domain/repositories/question.repository.js'
import type { ExamSession } from '../domain/entities/exam-session.entity.js'
import { computeSessionResult } from '../domain/policies/compute-session-result.policy.js'
import { IExamSessionRepository } from '../domain/repositories/exam-session.repository.js'
import { ISessionFinalizer } from '../domain/repositories/session-finalizer.port.js'
import { loadPaperSources } from './load-paper-sources.js'

@Injectable()
export class FinalizeSessionService extends ISessionFinalizer {
  constructor(
    private readonly sessions: IExamSessionRepository,
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
  ) {
    super()
  }

  async finalizeIfDue(session: ExamSession, now: Date): Promise<ExamSession> {
    if (
      session.status !== 'IN_PROGRESS' ||
      now.getTime() < session.finalizeAt.getTime()
    ) {
      return session
    }
    return this.finalize(session.id, 'EXPIRED', now)
  }

  async finalize(
    sessionId: string,
    as: 'SUBMITTED' | 'EXPIRED',
    now: Date,
  ): Promise<ExamSession> {
    const session = await this.sessions.findById(sessionId)
    if (session === null) {
      throw new NotFoundException('Sesi ujian tidak ditemukan')
    }
    if (session.status !== 'IN_PROGRESS') return session

    const sources = await loadPaperSources(
      this.schedules,
      this.packages,
      this.questions,
      session.scheduleId,
    )
    const closed = await this.sessions.close(session.id, (answers) => {
      const result = computeSessionResult(sources, answers)
      const graded = result.pendingManual === 0
      return {
        status: graded ? 'GRADED' : as,
        submittedAt: as === 'SUBMITTED' ? now : null,
        gradedAt: graded ? now : null,
        rawScore: result.rawScore,
        maxScore: result.maxScore,
        scores: result.scores,
        publish: !(as === 'EXPIRED' && answers.length === 0),
      }
    })
    if (closed !== null) return closed

    const current = await this.sessions.findById(session.id)
    if (current === null) {
      throw new NotFoundException('Sesi ujian tidak ditemukan')
    }
    return current
  }
}
