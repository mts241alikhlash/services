import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import {
  STAFF,
  TEACHER,
  build,
  paperWithManual,
  submitted,
  type World,
} from '../../exam-grading.test-support.js'
import { GradeAnswerUseCase } from './grade-answer.use-case.js'

const NOW = new Date('2026-11-03T02:00:00.000Z')

describe('GradeAnswerUseCase', () => {
  const make = (w: World) =>
    new GradeAnswerUseCase(
      w.scope,
      w.schedules,
      w.packages,
      w.questions,
      w.sessions,
    )

  async function setup(world = build()) {
    const { schedule, questionIds } = await paperWithManual(world)
    const [mc, essay, short] = questionIds
    const session = submitted(world, schedule, {
      [mc]: { key: 'B' },
      [essay]: { text: 'uraian' },
      [short]: { text: 'Bandung' },
    })
    return { world, schedule, mc, essay, short, session }
  }

  it('grades a manual answer and keeps the session open while others wait', async () => {
    const { world, essay } = await setup()

    const item = await make(world).execute(
      TEACHER,
      'ses-1',
      essay,
      { score: 7.5, note: 'cukup' },
      NOW,
    )

    expect(item).toMatchObject({
      questionId: essay,
      score: 7.5,
      note: 'cukup',
      gradedAt: NOW,
      needsGrading: false,
    })
    expect(world.sessions.sessions.get('ses-1')).toMatchObject({
      status: 'SUBMITTED',
      gradedAt: null,
    })
    expect(world.sessions.publications.size).toBe(0)
  })

  it('closes the session with the last grade and queues one publication', async () => {
    const { world, essay, short } = await setup()
    await make(world).execute(TEACHER, 'ses-1', essay, { score: 7.5 }, NOW)

    await make(world).execute(TEACHER, 'ses-1', short, { score: 4 }, NOW)

    expect(world.sessions.sessions.get('ses-1')).toMatchObject({
      status: 'GRADED',
      rawScore: 13.5,
      maxScore: 16,
      gradedAt: NOW,
    })
    expect([...world.sessions.publications]).toEqual([['ses-1', 'PENDING']])
  })

  it('regrading a graded session updates the score and queues it again', async () => {
    const { world, essay, short } = await setup()
    await make(world).execute(TEACHER, 'ses-1', essay, { score: 7.5 }, NOW)
    await make(world).execute(TEACHER, 'ses-1', short, { score: 4 }, NOW)
    world.sessions.publications.set('ses-1', 'SENT')

    await make(world).execute(TEACHER, 'ses-1', essay, { score: 9 }, NOW)

    expect(world.sessions.sessions.get('ses-1')?.rawScore).toBe(15)
    expect(world.sessions.publications.get('ses-1')).toBe('PENDING')
    expect(world.sessions.publications.size).toBe(1)
  })

  it('rejects a score above the points or below zero', async () => {
    const { world, essay } = await setup()

    await expect(
      make(world).execute(TEACHER, 'ses-1', essay, { score: 10.5 }, NOW),
    ).rejects.toThrow(BadRequestException)
    await expect(
      make(world).execute(TEACHER, 'ses-1', essay, { score: -1 }, NOW),
    ).rejects.toThrow(BadRequestException)
    await expect(
      make(world).execute(TEACHER, 'ses-1', essay, { score: Number.NaN }, NOW),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects grading an objective question and a question outside the paper', async () => {
    const { world, mc } = await setup()

    await expect(
      make(world).execute(TEACHER, 'ses-1', mc, { score: 1 }, NOW),
    ).rejects.toThrow('Soal ini dinilai otomatis')
    await expect(
      make(world).execute(
        TEACHER,
        'ses-1',
        '99999999-9999-4999-8999-999999999999',
        { score: 1 },
        NOW,
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects an unanswered or blank answer', async () => {
    const world = build()
    const { schedule, questionIds } = await paperWithManual(world)
    submitted(world, schedule, { [questionIds[1]]: { text: '  ' } })

    await expect(
      make(world).execute(TEACHER, 'ses-1', questionIds[1], { score: 1 }, NOW),
    ).rejects.toThrow(BadRequestException)
    await expect(
      make(world).execute(TEACHER, 'ses-1', questionIds[2], { score: 1 }, NOW),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects an in-progress session', async () => {
    const world = build()
    const { schedule, questionIds } = await paperWithManual(world)
    submitted(
      world,
      schedule,
      { [questionIds[1]]: { text: 'x' } },
      { status: 'IN_PROGRESS' },
    )

    await expect(
      make(world).execute(TEACHER, 'ses-1', questionIds[1], { score: 1 }, NOW),
    ).rejects.toThrow(ConflictException)
  })

  it('answers 404 to a teacher of another class and for an unknown session', async () => {
    const world = build({ taught: [] })
    const { schedule, questionIds } = await paperWithManual(world)
    submitted(world, schedule, { [questionIds[1]]: { text: 'x' } })

    await expect(
      make(world).execute(TEACHER, 'ses-1', questionIds[1], { score: 1 }, NOW),
    ).rejects.toThrow(NotFoundException)
    await expect(
      make(world).execute(
        TEACHER,
        'missing',
        questionIds[1],
        { score: 1 },
        NOW,
      ),
    ).rejects.toThrow(NotFoundException)
  })

  it('records who graded, also for manage-all', async () => {
    const { world, essay } = await setup(build({ taught: [], employee: null }))

    await make(world).execute(STAFF, 'ses-1', essay, { score: 5 }, NOW)

    const stored = [...world.sessions.answers.values()].find(
      (row) => row.questionId === essay,
    )
    expect(stored?.gradedById).toBe(STAFF.id)
  })

  it('two grades at once leave one publication and the right total', async () => {
    const { world, essay, short } = await setup()

    await Promise.all([
      make(world).execute(TEACHER, 'ses-1', essay, { score: 6 }, NOW),
      make(world).execute(TEACHER, 'ses-1', short, { score: 2 }, NOW),
    ])

    expect(world.sessions.sessions.get('ses-1')).toMatchObject({
      status: 'GRADED',
      rawScore: 10,
    })
    expect(world.sessions.publications.size).toBe(1)
  })
})
