import { randomUUID } from 'node:crypto'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { PrismaExamScoreRepository } from './prisma-exam-score.repository.js'

const suite = process.env.EXAM_DB_TESTS === '1' ? describe : describe.skip

suite('PrismaExamScoreRepository against a real database', () => {
  const prisma = new PrismaService({
    get: (key: string) => process.env[key],
  } as unknown as ConfigService)
  const repository = new PrismaExamScoreRepository(prisma)
  const semesterId = randomUUID()
  const subjectId = randomUUID()
  const classroomId = randomUUID()
  const sessionIds: string[] = []

  const input = (
    overrides: Partial<Parameters<typeof repository.upsert>[0]> = {},
  ) => {
    const examSessionId = randomUUID()
    sessionIds.push(examSessionId)
    return {
      examSessionId,
      enrollmentId: randomUUID(),
      studentId: randomUUID(),
      studentName: 'Ahmad Fauzi',
      studentNis: '2024001',
      subjectId,
      gradeId: randomUUID(),
      classroomId,
      semesterId,
      examTitle: 'UTS',
      rawScore: 8,
      maxScore: 10,
      score: 80,
      gradedAt: new Date('2026-11-03T02:00:00.000Z'),
      ...overrides,
    }
  }

  afterAll(async () => {
    await prisma.examScore.deleteMany({
      where: { examSessionId: { in: sessionIds } },
    })
    await prisma.$disconnect()
  })

  it('stores one row per session and updates it on resend', async () => {
    const first = input()
    const stored = await repository.upsert(first)
    const again = await repository.upsert({ ...first, rawScore: 9, score: 90 })

    expect(again.id).toBe(stored.id)
    expect(again.score).toBe(90)
    expect(
      await prisma.examScore.count({
        where: { examSessionId: first.examSessionId },
      }),
    ).toBe(1)
  })

  it('filters by semester, classroom, subject and the teacher pairs', async () => {
    await repository.upsert(input())
    await repository.upsert(input({ classroomId: randomUUID() }))
    await repository.upsert(input({ semesterId: randomUUID() }))

    const mine = await repository.findPage({
      page: 1,
      limit: 50,
      semesterId,
      pairs: [{ subjectId, classroomId }],
    })
    const none = await repository.findPage({
      page: 1,
      limit: 50,
      semesterId,
      pairs: [],
    })
    const wholeSemester = await repository.findPage({
      page: 1,
      limit: 50,
      semesterId,
      pairs: null,
    })

    expect(mine.total).toBe(2)
    expect(mine.data.every((row) => row.classroomId === classroomId)).toBe(true)
    expect(none.total).toBe(0)
    expect(wholeSemester.total).toBe(3)
  })
})
