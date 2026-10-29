import { randomUUID } from 'node:crypto'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../../core/database/prisma.service.js'
import { PrismaExamScheduleRepository } from '../../../exam-schedule/infrastructure/persistence/prisma/prisma-exam-schedule.repository.js'
import { PrismaScheduleSessionGuard } from '../../../exam-schedule/infrastructure/persistence/prisma/prisma-schedule-session-guard.js'
import { PrismaExamSessionRepository } from '../../../exam-session/infrastructure/persistence/prisma/prisma-exam-session.repository.js'
import { PrismaScorePublicationRepository } from './prisma-score-publication.repository.js'

const enabled = process.env.EXAM_DB_TESTS === '1'
const suite = enabled ? describe : describe.skip

suite('Prisma queries against a real database', () => {
  const prisma = new PrismaService({
    get: (key: string) => process.env[key],
  } as unknown as ConfigService)
  const schedules = new PrismaExamScheduleRepository(prisma)
  const sessions = new PrismaExamSessionRepository(prisma)
  const publications = new PrismaScorePublicationRepository(prisma)
  const guard = new PrismaScheduleSessionGuard(prisma)

  const id = () => randomUUID()
  const subjectId = id()
  const gradeId = id()
  const classroomId = id()
  const semesterId = id()
  const employeeId = id()
  const userId = id()
  const questionIds: string[] = []
  const packageIds: string[] = []
  const scheduleIds: string[] = []
  const sessionIds: string[] = []
  const NOW = new Date('2026-11-03T02:00:00.000Z')

  async function schedule(sem = semesterId) {
    const question = await prisma.question.create({
      data: {
        subjectId,
        gradeId,
        authorEmployeeId: employeeId,
        type: 'ESSAY',
        status: 'APPROVED',
        approvedVersion: 1,
        createdById: userId,
      },
    })
    questionIds.push(question.id)
    const pkg = await prisma.examPackage.create({
      data: {
        title: 'UTS DB',
        subjectId,
        gradeId,
        createdById: userId,
        items: {
          create: { questionId: question.id, questionVersion: 1, position: 1 },
        },
      },
    })
    packageIds.push(pkg.id)
    const row = await prisma.examSchedule.create({
      data: {
        packageId: pkg.id,
        classroomId,
        semesterId: sem,
        startsAt: new Date('2026-11-02T01:00:00.000Z'),
        endsAt: new Date('2026-11-02T04:00:00.000Z'),
        durationMinutes: 90,
        createdById: userId,
      },
    })
    scheduleIds.push(row.id)
    return { scheduleId: row.id, questionId: question.id }
  }

  async function session(
    scheduleId: string,
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' = 'SUBMITTED',
  ) {
    const row = await prisma.examSession.create({
      data: {
        scheduleId,
        studentId: id(),
        userId: id(),
        deviceId: 'dev',
        shuffleSeed: 'seed',
        startedAt: NOW,
        deadline: NOW,
        finalizeAt: NOW,
        status,
      },
    })
    sessionIds.push(row.id)
    return row
  }

  async function answer(sessionId: string, questionId: string, text = 'x') {
    return prisma.examAnswer.create({
      data: {
        sessionId,
        questionId,
        answer: { text },
        clientId: id(),
      },
    })
  }

  afterAll(async () => {
    await prisma.scorePublication.deleteMany({
      where: { sessionId: { in: sessionIds } },
    })
    await prisma.examAnswer.deleteMany({
      where: { sessionId: { in: sessionIds } },
    })
    await prisma.examSession.deleteMany({ where: { id: { in: sessionIds } } })
    await prisma.examSchedule.deleteMany({ where: { id: { in: scheduleIds } } })
    await prisma.examPackageItem.deleteMany({
      where: { packageId: { in: packageIds } },
    })
    await prisma.examPackage.deleteMany({ where: { id: { in: packageIds } } })
    await prisma.question.deleteMany({ where: { id: { in: questionIds } } })
    await prisma.$disconnect()
  })

  it('finds only the schedules with sessions that match the teacher pairs and the semester', async () => {
    const mine = await schedule()
    await session(mine.scheduleId)
    const empty = await schedule()
    const otherSemester = await schedule(id())
    await session(otherSemester.scheduleId)

    const hit = await schedules.findForGrading({
      semesterId,
      pairs: [{ subjectId, classroomId }],
      page: 1,
      limit: 50,
    })
    const wrongPair = await schedules.findForGrading({
      semesterId,
      pairs: [{ subjectId: id(), classroomId }],
      page: 1,
      limit: 50,
    })
    const all = await schedules.findForGrading({
      semesterId,
      pairs: null,
      page: 1,
      limit: 50,
    })
    const none = await schedules.findForGrading({
      semesterId,
      pairs: [],
      page: 1,
      limit: 50,
    })

    expect(hit.data.map((row) => row.id)).toContain(mine.scheduleId)
    expect(hit.data.map((row) => row.id)).not.toContain(empty.scheduleId)
    expect(hit.data.map((row) => row.id)).not.toContain(
      otherSemester.scheduleId,
    )
    expect(hit.data[0].subjectId).toBe(subjectId)
    expect(wrongPair.data.map((row) => row.id)).not.toContain(mine.scheduleId)
    expect(all.data.map((row) => row.id)).toContain(mine.scheduleId)
    expect(none.total).toBe(0)
  })

  it('counts sessions per schedule and tells which schedules have any', async () => {
    const s = await schedule()
    await session(s.scheduleId, 'SUBMITTED')
    await session(s.scheduleId, 'GRADED')
    await session(s.scheduleId, 'IN_PROGRESS')
    const quiet = await schedule()

    const counts = await sessions.countsBySchedule([
      s.scheduleId,
      quiet.scheduleId,
    ])
    const started = await guard.idsWithSessions([
      s.scheduleId,
      quiet.scheduleId,
    ])

    expect(counts.get(s.scheduleId)).toEqual({
      sessions: 3,
      awaitingGrading: 1,
      graded: 1,
    })
    expect(counts.has(quiet.scheduleId)).toBe(false)
    expect([...started]).toEqual([s.scheduleId])
    expect(await guard.hasSessions(s.scheduleId)).toBe(true)
    expect(await guard.hasSessions(quiet.scheduleId)).toBe(false)
  })

  it('grades the last answer, closes the session and queues one publication, then regrades', async () => {
    const s = await schedule()
    const row = await session(s.scheduleId)
    await answer(row.id, s.questionId)
    const recompute = (rows: { score: number | null }[]) => ({
      rawScore: rows.reduce((sum, item) => sum + (item.score ?? 0), 0),
      maxScore: 10,
      pendingManual: rows.filter((item) => item.score === null).length,
    })

    const first = await sessions.applyGrade(
      {
        sessionId: row.id,
        questionId: s.questionId,
        score: 7,
        note: 'ok',
        gradedById: id(),
        at: NOW,
      },
      recompute,
    )
    expect(first?.session).toMatchObject({
      status: 'GRADED',
      rawScore: 7,
      maxScore: 10,
    })
    expect(first?.answer).toMatchObject({ score: 7, gradeNote: 'ok' })
    expect(
      await prisma.scorePublication.count({ where: { sessionId: row.id } }),
    ).toBe(1)

    await prisma.scorePublication.update({
      where: { sessionId: row.id },
      data: { status: 'SENT', attempts: 3, permanentFailures: 2 },
    })
    await sessions.applyGrade(
      {
        sessionId: row.id,
        questionId: s.questionId,
        score: 9,
        note: null,
        gradedById: id(),
        at: new Date(NOW.getTime() + 1000),
      },
      recompute,
    )
    const publication = await prisma.scorePublication.findUniqueOrThrow({
      where: { sessionId: row.id },
    })
    expect(publication).toMatchObject({
      status: 'PENDING',
      attempts: 0,
      permanentFailures: 0,
    })
    expect((await sessions.findById(row.id))?.rawScore).toBe(9)
  })

  it('returns null when the answer does not exist', async () => {
    const s = await schedule()
    const row = await session(s.scheduleId)

    expect(
      await sessions.applyGrade(
        {
          sessionId: row.id,
          questionId: s.questionId,
          score: 1,
          note: null,
          gradedById: id(),
          at: NOW,
        },
        () => ({ rawScore: 0, maxScore: 0, pendingManual: 0 }),
      ),
    ).toBeNull()
  })

  it('keeps one publication and the right total when two grades race', async () => {
    const first = await schedule()
    const second = await prisma.question.create({
      data: {
        subjectId,
        gradeId,
        authorEmployeeId: employeeId,
        type: 'ESSAY',
        status: 'APPROVED',
        approvedVersion: 1,
        createdById: userId,
      },
    })
    questionIds.push(second.id)
    const row = await session(first.scheduleId)
    await answer(row.id, first.questionId)
    await answer(row.id, second.id)
    const recompute = (rows: { score: number | null }[]) => ({
      rawScore: rows.reduce((sum, item) => sum + (item.score ?? 0), 0),
      maxScore: 20,
      pendingManual: rows.filter((item) => item.score === null).length,
    })
    const grade = (questionId: string, score: number) =>
      sessions.applyGrade(
        {
          sessionId: row.id,
          questionId,
          score,
          note: null,
          gradedById: id(),
          at: NOW,
        },
        recompute,
      )

    await Promise.all([grade(first.questionId, 6), grade(second.id, 4)])

    expect(await sessions.findById(row.id)).toMatchObject({
      status: 'GRADED',
      rawScore: 10,
    })
    expect(
      await prisma.scorePublication.count({ where: { sessionId: row.id } }),
    ).toBe(1)
  })

  it('refuses a write to a closed session and closes with a publication', async () => {
    const s = await schedule()
    const row = await session(s.scheduleId, 'IN_PROGRESS')
    await answer(row.id, s.questionId)

    const closed = await sessions.close(row.id, () => ({
      status: 'GRADED',
      submittedAt: NOW,
      gradedAt: NOW,
      rawScore: 0,
      maxScore: 10,
      scores: [],
    }))
    const late = await sessions.upsertAnswer({
      sessionId: row.id,
      questionId: s.questionId,
      clientId: id(),
      answer: { text: 'terlambat' },
      receivedAfterDeadline: true,
    })

    expect(closed?.status).toBe('GRADED')
    expect(late).toBeNull()
    expect(
      await prisma.scorePublication.count({ where: { sessionId: row.id } }),
    ).toBe(1)
    expect((await sessions.publicationStatuses([row.id])).get(row.id)).toBe(
      'PENDING',
    )
  })

  it('orders candidates with never-tried first and skips excluded and exhausted ones', async () => {
    const s = await schedule()
    const fresh = await session(s.scheduleId, 'GRADED')
    const tried = await session(s.scheduleId, 'GRADED')
    const exhausted = await session(s.scheduleId, 'GRADED')
    await prisma.scorePublication.createMany({
      data: [
        { sessionId: fresh.id },
        { sessionId: tried.id, attempts: 1, lastAttemptAt: NOW },
        {
          sessionId: exhausted.id,
          attempts: 12,
          permanentFailures: 10,
          lastAttemptAt: NOW,
        },
      ],
    })

    const rows = await publications.findCandidates(500, [])
    const mine = rows.filter((row) =>
      [fresh.id, tried.id, exhausted.id].includes(row.sessionId),
    )
    const skipped = await publications.findCandidates(500, [fresh.id])

    expect(mine.map((row) => row.sessionId)).toEqual([fresh.id, tried.id])
    expect(skipped.map((row) => row.sessionId)).not.toContain(fresh.id)
  })

  it('applies a mark only to the graded version that was sent', async () => {
    const s = await schedule()
    const row = await prisma.examSession.update({
      where: { id: (await session(s.scheduleId, 'GRADED')).id },
      data: { gradedAt: NOW },
    })
    await prisma.scorePublication.create({ data: { sessionId: row.id } })

    await publications.markSent(row.id, NOW, new Date(NOW.getTime() + 5000))
    expect((await sessions.publicationStatuses([row.id])).get(row.id)).toBe(
      'PENDING',
    )

    await publications.markFailed(row.id, NOW, 'down', false, NOW)
    expect(
      await prisma.scorePublication.findUniqueOrThrow({
        where: { sessionId: row.id },
      }),
    ).toMatchObject({
      attempts: 1,
      permanentFailures: 0,
      lastError: 'down',
    })

    await publications.markSent(row.id, NOW, NOW)
    expect((await sessions.publicationStatuses([row.id])).get(row.id)).toBe(
      'SENT',
    )
  })
})
