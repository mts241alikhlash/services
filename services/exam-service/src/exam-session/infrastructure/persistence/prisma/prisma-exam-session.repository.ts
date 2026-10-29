import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { Prisma } from '../../../../generated/prisma/client.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type {
  ExamAnswerRecord,
  ExamSession,
  ExamSessionStatus,
} from '../../../domain/entities/exam-session.entity.js'
import {
  IExamSessionRepository,
  type NewExamSession,
  type GradeAnswerInput,
  type GradeRecompute,
  type SaveAnswerInput,
  type ScheduleSessionCounts,
  type SessionClosure,
} from '../../../domain/repositories/exam-session.repository.js'
import { toAnswer, toSession } from './prisma-exam-session.mapper.js'

@Injectable()
export class PrismaExamSessionRepository extends IExamSessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string): Promise<ExamSession | null> {
    const row = await this.prisma.examSession.findUnique({ where: { id } })
    return row ? toSession(row) : null
  }

  async findByScheduleAndStudent(
    scheduleId: string,
    studentId: string,
  ): Promise<ExamSession | null> {
    const row = await this.prisma.examSession.findUnique({
      where: { scheduleId_studentId: { scheduleId, studentId } },
    })
    return row ? toSession(row) : null
  }

  async createInitial(input: NewExamSession): Promise<ExamSession | null> {
    try {
      const row = await this.prisma.examSession.create({ data: input })
      return toSession(row)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null
      }
      throw error
    }
  }

  async bindDevice(id: string, deviceId: string): Promise<ExamSession | null> {
    const result = await this.prisma.examSession.updateMany({
      where: { id, status: 'IN_PROGRESS', deviceId: null },
      data: { deviceId },
    })
    if (result.count === 0) return null
    return this.findById(id)
  }

  async findAnswerByClientId(
    sessionId: string,
    clientId: string,
  ): Promise<ExamAnswerRecord | null> {
    const row = await this.prisma.examAnswer.findUnique({
      where: { sessionId_clientId: { sessionId, clientId } },
    })
    return row ? toAnswer(row) : null
  }

  async upsertAnswer(input: SaveAnswerInput): Promise<ExamAnswerRecord | null> {
    const answer = input.answer as unknown as Prisma.InputJsonValue
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM exam_sessions WHERE id = ${input.sessionId}::uuid FOR UPDATE`
        const session = await tx.examSession.findUnique({
          where: { id: input.sessionId },
          select: { status: true },
        })
        if (session?.status !== 'IN_PROGRESS') return null
        const row = await tx.examAnswer.upsert({
          where: {
            sessionId_questionId: {
              sessionId: input.sessionId,
              questionId: input.questionId,
            },
          },
          create: { ...input, answer },
          update: {
            answer,
            clientId: input.clientId,
            receivedAfterDeadline: input.receivedAfterDeadline,
            score: null,
          },
        })
        return toAnswer(row)
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.findAnswerByClientId(
          input.sessionId,
          input.clientId,
        )
        if (existing !== null) return existing
      }
      throw error
    }
  }

  async close(
    id: string,
    build: (answers: ExamAnswerRecord[]) => SessionClosure,
  ): Promise<ExamSession | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM exam_sessions WHERE id = ${id}::uuid FOR UPDATE`
      const current = await tx.examSession.findUnique({ where: { id } })
      if (current?.status !== 'IN_PROGRESS') return null
      const rows = await tx.examAnswer.findMany({ where: { sessionId: id } })
      const closure = build(rows.map(toAnswer))
      const row = await tx.examSession.update({
        where: { id },
        data: {
          status: closure.status,
          submittedAt: closure.submittedAt,
          gradedAt: closure.gradedAt,
          rawScore: closure.rawScore,
          maxScore: closure.maxScore,
        },
      })
      if (closure.status === 'GRADED') {
        await tx.scorePublication.upsert({
          where: { sessionId: id },
          create: { sessionId: id },
          update: {},
        })
      }
      for (const { answerId, score } of closure.scores) {
        await tx.examAnswer.update({
          where: { id: answerId },
          data: { score },
        })
      }
      return toSession(row)
    })
  }

  async applyGrade(
    input: GradeAnswerInput,
    recompute: (answers: ExamAnswerRecord[]) => GradeRecompute,
  ): Promise<{ answer: ExamAnswerRecord; session: ExamSession } | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM exam_sessions WHERE id = ${input.sessionId}::uuid FOR UPDATE`
      const current = await tx.examSession.findUnique({
        where: { id: input.sessionId },
      })
      const target = await tx.examAnswer.findUnique({
        where: {
          sessionId_questionId: {
            sessionId: input.sessionId,
            questionId: input.questionId,
          },
        },
      })
      if (current === null || target === null) return null

      const graded = await tx.examAnswer.update({
        where: { id: target.id },
        data: {
          score: input.score,
          gradeNote: input.note,
          gradedById: input.gradedById,
          gradedAt: input.at,
        },
      })
      const rows = await tx.examAnswer.findMany({
        where: { sessionId: input.sessionId },
      })
      const result = recompute(rows.map(toAnswer))
      const done = result.pendingManual === 0
      const session = await tx.examSession.update({
        where: { id: input.sessionId },
        data: {
          rawScore: result.rawScore,
          maxScore: result.maxScore,
          status: done ? 'GRADED' : current.status,
          gradedAt: done ? input.at : null,
        },
      })
      if (done) {
        await tx.scorePublication.upsert({
          where: { sessionId: input.sessionId },
          create: { sessionId: input.sessionId },
          update: {
            status: 'PENDING',
            attempts: 0,
            permanentFailures: 0,
            lastError: null,
            lastAttemptAt: null,
            sentAt: null,
          },
        })
      }
      return { answer: toAnswer(graded), session: toSession(session) }
    })
  }

  async findDueIds(
    now: Date,
    limit: number,
    excludeIds: string[],
  ): Promise<string[]> {
    const rows = await this.prisma.examSession.findMany({
      where: {
        status: 'IN_PROGRESS',
        finalizeAt: { lte: now },
        id: { notIn: excludeIds },
      },
      orderBy: { finalizeAt: 'asc' },
      take: limit,
      select: { id: true },
    })
    return rows.map((row) => row.id)
  }

  async release(
    id: string,
    byUserId: string,
    at: Date,
  ): Promise<ExamSession | null> {
    const result = await this.prisma.examSession.updateMany({
      where: { id, status: 'IN_PROGRESS' },
      data: { deviceId: null, releasedAt: at, releasedById: byUserId },
    })
    if (result.count === 0) return null
    return this.findById(id)
  }

  async recordViolations(id: string, count: number): Promise<void> {
    await this.prisma.examSession.updateMany({
      where: { id, status: 'IN_PROGRESS', violationCount: { lt: count } },
      data: { violationCount: count },
    })
  }

  async countsBySchedule(
    scheduleIds: string[],
  ): Promise<Map<string, ScheduleSessionCounts>> {
    const grouped = await this.prisma.examSession.groupBy({
      by: ['scheduleId', 'status'],
      where: { scheduleId: { in: scheduleIds } },
      _count: { _all: true },
    })
    const counts = new Map<string, ScheduleSessionCounts>()
    for (const row of grouped) {
      const entry = counts.get(row.scheduleId) ?? {
        sessions: 0,
        awaitingGrading: 0,
        graded: 0,
      }
      entry.sessions += row._count._all
      if (row.status === 'GRADED') entry.graded += row._count._all
      if (row.status === 'SUBMITTED' || row.status === 'EXPIRED') {
        entry.awaitingGrading += row._count._all
      }
      counts.set(row.scheduleId, entry)
    }
    return counts
  }

  async publicationStatuses(
    sessionIds: string[],
  ): Promise<Map<string, 'PENDING' | 'SENT'>> {
    const rows = await this.prisma.scorePublication.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { sessionId: true, status: true },
    })
    return new Map(rows.map((row) => [row.sessionId, row.status]))
  }

  async findPageBySchedule(
    scheduleId: string,
    page: number,
    limit: number,
    status?: ExamSessionStatus,
  ): Promise<PaginatedResult<ExamSession>> {
    const where = { scheduleId, ...(status ? { status } : {}) }
    const [rows, total] = await Promise.all([
      this.prisma.examSession.findMany({
        where,
        orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.examSession.count({ where }),
    ])
    return { data: rows.map(toSession), total, page, limit }
  }

  async listAnswers(sessionId: string): Promise<ExamAnswerRecord[]> {
    const rows = await this.prisma.examAnswer.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toAnswer)
  }

  async listByStudentAndSchedules(
    studentId: string,
    scheduleIds: string[],
  ): Promise<ExamSession[]> {
    if (scheduleIds.length === 0) return []
    const rows = await this.prisma.examSession.findMany({
      where: { studentId, scheduleId: { in: scheduleIds } },
    })
    return rows.map(toSession)
  }
}
