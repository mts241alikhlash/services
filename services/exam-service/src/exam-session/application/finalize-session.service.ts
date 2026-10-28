import { Injectable, NotFoundException } from '@nestjs/common'
import { IExamPackageRepository } from '../../exam-package/domain/repositories/exam-package.repository.js'
import { IExamScheduleRepository } from '../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IQuestionRepository } from '../../question/domain/repositories/question.repository.js'
import type { ExamSession } from '../domain/entities/exam-session.entity.js'
import { scoreAnswer } from '../domain/policies/score-answer.policy.js'
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
      const answerOf = new Map(answers.map((row) => [row.questionId, row]))
      let rawScore = 0
      let maxScore = 0
      let hasManual = false
      const scores: { answerId: string; score: number | null }[] = []
      for (const source of sources) {
        maxScore += source.points
        const answer = answerOf.get(source.questionId) ?? null
        const { score } = scoreAnswer(
          source.type,
          source.content,
          answer?.answer ?? null,
          source.points,
        )
        if (score === null) hasManual = true
        else rawScore += score
        if (answer !== null) scores.push({ answerId: answer.id, score })
      }
      return {
        status: hasManual ? as : 'GRADED',
        submittedAt: as === 'SUBMITTED' ? now : null,
        rawScore: Math.round(rawScore * 10000) / 10000,
        maxScore,
        scores,
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
