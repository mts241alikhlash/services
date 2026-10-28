import { randomUUID } from 'node:crypto'
import type {
  ExamAnswerRecord,
  ExamSession,
  ExamSessionStatus,
} from '../domain/entities/exam-session.entity.js'
import {
  IExamSessionRepository,
  type GradeAnswerInput,
  type GradeRecompute,
  type NewExamSession,
  type SaveAnswerInput,
  type ScheduleSessionCounts,
  type SessionClosure,
} from '../domain/repositories/exam-session.repository.js'

export class FakeExamSessionRepository extends IExamSessionRepository {
  readonly sessions = new Map<string, ExamSession>()

  findById(id: string) {
    return Promise.resolve(this.sessions.get(id) ?? null)
  }

  findByScheduleAndStudent(scheduleId: string, studentId: string) {
    const found = [...this.sessions.values()].find(
      (session) =>
        session.scheduleId === scheduleId && session.studentId === studentId,
    )
    return Promise.resolve(found ?? null)
  }

  createInitial(input: NewExamSession) {
    const existing = [...this.sessions.values()].find(
      (session) =>
        session.scheduleId === input.scheduleId &&
        session.studentId === input.studentId,
    )
    if (existing) return Promise.resolve(null)
    const now = new Date()
    const session: ExamSession = {
      id: randomUUID(),
      ...input,
      status: 'IN_PROGRESS',
      submittedAt: null,
      rawScore: null,
      maxScore: null,
      releasedAt: null,
      releasedById: null,
      gradedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    this.sessions.set(session.id, session)
    return Promise.resolve(session)
  }

  bindDevice(id: string, deviceId: string) {
    const session = this.sessions.get(id)
    if (!session) return Promise.resolve(null)
    const updated = { ...session, deviceId }
    this.sessions.set(id, updated)
    return Promise.resolve(updated)
  }

  readonly answers = new Map<string, ExamAnswerRecord>()
  readonly publications = new Map<string, 'PENDING' | 'SENT'>()

  findAnswerByClientId(sessionId: string, clientId: string) {
    const found = [...this.answers.values()].find(
      (answer) =>
        answer.sessionId === sessionId && answer.clientId === clientId,
    )
    return Promise.resolve(found ?? null)
  }

  upsertAnswer(input: SaveAnswerInput) {
    if (this.sessions.get(input.sessionId)?.status !== 'IN_PROGRESS') {
      return Promise.resolve(null)
    }
    const now = new Date()
    const existing = [...this.answers.values()].find(
      (answer) =>
        answer.sessionId === input.sessionId &&
        answer.questionId === input.questionId,
    )
    const record: ExamAnswerRecord = {
      id: existing?.id ?? randomUUID(),
      score: null,
      gradedById: null,
      gradedAt: null,
      gradeNote: null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...input,
    }
    this.answers.set(record.id, record)
    return Promise.resolve(record)
  }

  close(id: string, build: (answers: ExamAnswerRecord[]) => SessionClosure) {
    const session = this.sessions.get(id)
    if (session?.status !== 'IN_PROGRESS') return Promise.resolve(null)
    const closure = build(
      [...this.answers.values()].filter((answer) => answer.sessionId === id),
    )
    const closed: ExamSession = {
      ...session,
      status: closure.status,
      submittedAt: closure.submittedAt,
      gradedAt: closure.gradedAt,
      rawScore: closure.rawScore,
      maxScore: closure.maxScore,
    }
    this.sessions.set(id, closed)
    if (closure.status === 'GRADED') this.publications.set(id, 'PENDING')
    for (const { answerId, score } of closure.scores) {
      const answer = this.answers.get(answerId)
      if (answer) this.answers.set(answerId, { ...answer, score })
    }
    return Promise.resolve(closed)
  }

  applyGrade(
    input: GradeAnswerInput,
    recompute: (answers: ExamAnswerRecord[]) => GradeRecompute,
  ) {
    const session = this.sessions.get(input.sessionId)
    const existing = [...this.answers.values()].find(
      (row) =>
        row.sessionId === input.sessionId &&
        row.questionId === input.questionId,
    )
    if (!session || !existing) return Promise.resolve(null)

    const answer: ExamAnswerRecord = {
      ...existing,
      score: input.score,
      gradeNote: input.note,
      gradedById: input.gradedById,
      gradedAt: input.at,
    }
    this.answers.set(answer.id, answer)

    const result = recompute(
      [...this.answers.values()].filter((row) => row.sessionId === session.id),
    )
    const graded = result.pendingManual === 0
    const updated: ExamSession = {
      ...session,
      rawScore: result.rawScore,
      maxScore: result.maxScore,
      status: graded ? 'GRADED' : session.status,
      gradedAt: graded ? input.at : null,
    }
    this.sessions.set(session.id, updated)
    if (graded) this.publications.set(session.id, 'PENDING')
    return Promise.resolve({ answer, session: updated })
  }

  findDueIds(now: Date, limit: number, excludeIds: string[]) {
    return Promise.resolve(
      [...this.sessions.values()]
        .filter(
          (session) =>
            session.status === 'IN_PROGRESS' &&
            !excludeIds.includes(session.id) &&
            session.finalizeAt.getTime() <= now.getTime(),
        )
        .slice(0, limit)
        .map((session) => session.id),
    )
  }

  release(id: string, byUserId: string, at: Date) {
    const session = this.sessions.get(id)
    if (session?.status !== 'IN_PROGRESS') return Promise.resolve(null)
    const released: ExamSession = {
      ...session,
      deviceId: null,
      releasedAt: at,
      releasedById: byUserId,
    }
    this.sessions.set(id, released)
    return Promise.resolve(released)
  }

  countsBySchedule(scheduleIds: string[]) {
    const counts = new Map<string, ScheduleSessionCounts>()
    for (const session of this.sessions.values()) {
      if (!scheduleIds.includes(session.scheduleId)) continue
      const entry = counts.get(session.scheduleId) ?? {
        sessions: 0,
        awaitingGrading: 0,
        graded: 0,
      }
      entry.sessions += 1
      if (session.status === 'GRADED') entry.graded += 1
      if (session.status === 'SUBMITTED' || session.status === 'EXPIRED') {
        entry.awaitingGrading += 1
      }
      counts.set(session.scheduleId, entry)
    }
    return Promise.resolve(counts)
  }

  publicationStatuses(sessionIds: string[]) {
    return Promise.resolve(
      new Map([...this.publications].filter(([id]) => sessionIds.includes(id))),
    )
  }

  findPageBySchedule(
    scheduleId: string,
    page: number,
    limit: number,
    status?: ExamSessionStatus,
  ) {
    const rows = [...this.sessions.values()]
      .filter((session) => session.scheduleId === scheduleId)
      .filter((session) => !status || session.status === status)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
    return Promise.resolve({
      data: rows.slice((page - 1) * limit, page * limit),
      total: rows.length,
      page,
      limit,
    })
  }

  listAnswers(sessionId: string) {
    return Promise.resolve(
      [...this.answers.values()].filter(
        (answer) => answer.sessionId === sessionId,
      ),
    )
  }

  listByStudentAndSchedules(studentId: string, scheduleIds: string[]) {
    return Promise.resolve(
      [...this.sessions.values()].filter(
        (session) =>
          session.studentId === studentId &&
          scheduleIds.includes(session.scheduleId),
      ),
    )
  }
}
