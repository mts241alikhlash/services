import { randomUUID } from 'node:crypto'
import type {
  ExamScore,
  ExamScoreInput,
} from '../domain/entities/exam-score.entity.js'
import {
  IExamScoreRepository,
  type ExamScoreQuery,
} from '../domain/repositories/exam-score.repository.js'

export class FakeExamScoreRepository extends IExamScoreRepository {
  readonly rows = new Map<string, ExamScore>()

  upsert(input: ExamScoreInput) {
    const existing = [...this.rows.values()].find(
      (row) => row.examSessionId === input.examSessionId,
    )
    const now = new Date()
    const row: ExamScore = {
      id: existing?.id ?? randomUUID(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...input,
    }
    this.rows.set(row.id, row)
    return Promise.resolve(row)
  }

  findPage(query: ExamScoreQuery) {
    const rows = [...this.rows.values()]
      .filter((row) => !query.semesterId || row.semesterId === query.semesterId)
      .filter(
        (row) => !query.classroomId || row.classroomId === query.classroomId,
      )
      .filter((row) => !query.subjectId || row.subjectId === query.subjectId)
      .filter(
        (row) =>
          query.pairs === null ||
          query.pairs.some(
            (pair) =>
              pair.subjectId === row.subjectId &&
              pair.classroomId === row.classroomId,
          ),
      )
      .sort((a, b) => b.gradedAt.getTime() - a.gradedAt.getTime())
    return Promise.resolve({
      data: rows.slice(
        (query.page - 1) * query.limit,
        query.page * query.limit,
      ),
      total: rows.length,
      page: query.page,
      limit: query.limit,
    })
  }
}
