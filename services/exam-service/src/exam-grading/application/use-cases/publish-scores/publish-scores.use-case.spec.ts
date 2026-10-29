import { FakeEnrollment } from '../../../../exam-session/application/exam-session.test-support.js'
import {
  CLASSROOM_7A,
  SEMESTER_ID,
  build,
  paperWithManual,
  submitted,
  type World,
} from '../../exam-grading.test-support.js'
import { FakeScorePublicationRepository } from '../../score-publication.repository.fake.js'
import {
  IScorePublisherPort,
  type ExamScorePayload,
  type PublishOutcome,
} from '../../../../platform/score-publisher/score-publisher.port.js'
import { PublishScoresUseCase } from './publish-scores.use-case.js'

const NOW = new Date('2026-11-03T02:00:00.000Z')

class FakePublisher extends IScorePublisherPort {
  readonly sent: ExamScorePayload[] = []
  constructor(
    private readonly outcome: () => PublishOutcome = () => ({ result: 'SENT' }),
    private readonly during: () => void = () => undefined,
  ) {
    super()
  }

  publish(payload: ExamScorePayload) {
    this.sent.push(payload)
    this.during()
    return Promise.resolve(this.outcome())
  }
}

async function graded(world: World, id = 'ses-1', studentId = 'stu-1') {
  const { schedule } = await paperWithManual(world)
  const session = submitted(
    world,
    schedule,
    {},
    {
      id,
      studentId,
      status: 'GRADED',
      rawScore: 12,
      maxScore: 16,
      gradedAt: NOW,
    },
  )
  world.sessions.publications.set(id, 'PENDING')
  return { schedule, session }
}

describe('PublishScoresUseCase', () => {
  const make = (
    world: World,
    publisher = new FakePublisher(),
    enrollment = new FakeEnrollment(),
  ) => {
    const publications = new FakeScorePublicationRepository(world.sessions)
    return {
      publications,
      publisher,
      useCase: new PublishScoresUseCase(
        publications,
        world.sessions,
        world.schedules,
        enrollment,
        world.academic,
        publisher,
        world.students,
      ),
    }
  }

  it('sends a pending publication and marks it sent', async () => {
    const world = build()
    const { schedule } = await graded(world)
    const { useCase, publisher, publications } = make(world)

    expect(await useCase.execute(NOW)).toBe(1)

    expect(publisher.sent).toEqual([
      {
        examSessionId: 'ses-1',
        enrollmentId: 'enr-1',
        studentId: 'stu-1',
        studentName: null,
        studentNis: null,
        subjectId: schedule.subjectId,
        gradeId: CLASSROOM_7A.gradeId,
        classroomId: CLASSROOM_7A.id,
        semesterId: SEMESTER_ID,
        examTitle: schedule.packageTitle,
        rawScore: 12,
        maxScore: 16,
        score: 75,
        gradedAt: NOW.toISOString(),
      },
    ])
    expect(world.sessions.publications.get('ses-1')).toBe('SENT')
    expect(publications.states.get('ses-1')?.sentAt).toEqual(NOW)
  })

  it('does not send a sent publication again', async () => {
    const world = build()
    await graded(world)
    const { useCase, publisher } = make(world)

    await useCase.execute(NOW)
    await useCase.execute(new Date(NOW.getTime() + 3_600_000))

    expect(publisher.sent).toHaveLength(1)
  })

  it('rounds the score to a percentage with two decimals and survives a zero maximum', async () => {
    const world = build()
    await graded(world, 'a', 'stu-1')
    world.sessions.sessions.set('a', {
      ...world.sessions.sessions.get('a')!,
      rawScore: 1,
      maxScore: 3,
    })
    await graded(world, 'b', 'stu-2')
    world.sessions.sessions.set('b', {
      ...world.sessions.sessions.get('b')!,
      rawScore: 0,
      maxScore: 0,
    })
    const { useCase, publisher } = make(world)

    await useCase.execute(NOW)

    expect(publisher.sent.map((row) => row.score).sort()).toEqual([0, 33.33])
  })

  it('keeps it pending with a longer wait after a retry', async () => {
    const world = build()
    await graded(world)
    const { useCase, publisher, publications } = make(
      world,
      new FakePublisher(() => ({ result: 'RETRY', reason: 'down' })),
    )

    await useCase.execute(NOW)
    expect(publications.states.get('ses-1')).toMatchObject({
      attempts: 1,
      lastError: 'down',
    })

    await useCase.execute(new Date(NOW.getTime() + 60_000))
    expect(publisher.sent).toHaveLength(1)

    await useCase.execute(new Date(NOW.getTime() + 120_000))
    expect(publisher.sent).toHaveLength(2)
    expect(world.sessions.publications.get('ses-1')).toBe('PENDING')
  })

  it('stops after ten rejected attempts and keeps the reason', async () => {
    const world = build()
    await graded(world)
    const { useCase, publisher, publications } = make(
      world,
      new FakePublisher(() => ({
        result: 'REJECTED',
        reason: 'assessment-service refused with 422',
      })),
    )

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await useCase.execute(new Date(NOW.getTime() + attempt * 3 * 3_600_000))
    }

    expect(publisher.sent).toHaveLength(10)
    expect(publications.states.get('ses-1')).toMatchObject({
      permanentFailures: 10,
      lastError: 'assessment-service refused with 422',
    })
  })

  it('records a missing enrollment of an older session as a failed attempt with the reason', async () => {
    const world = build()
    await graded(world)
    world.sessions.sessions.set('ses-1', {
      ...world.sessions.sessions.get('ses-1')!,
      enrollmentId: null,
    })
    const { useCase, publisher, publications } = make(
      world,
      undefined,
      new FakeEnrollment({ enrollment: null }),
    )

    await useCase.execute(NOW)

    expect(publisher.sent).toHaveLength(0)
    expect(publications.states.get('ses-1')?.lastError).toContain('Pendaftaran')
  })

  it('one failure does not stop the others', async () => {
    const world = build()
    await graded(world, 'a', 'stu-1')
    await graded(world, 'b', 'stu-2')
    let calls = 0
    const { useCase, publications } = make(
      world,
      new FakePublisher(() =>
        calls++ === 0
          ? { result: 'RETRY', reason: 'down' }
          : { result: 'SENT' },
      ),
    )

    await useCase.execute(NOW)

    expect([...world.sessions.publications.values()].sort()).toEqual([
      'PENDING',
      'SENT',
    ])
    expect(publications.states.size).toBe(2)
  })

  it('drains more than one batch', async () => {
    const world = build()
    for (let index = 0; index < 120; index += 1)
      await graded(world, `s${index}`, `stu-${index}`)
    const { useCase, publisher } = make(world)

    await useCase.execute(NOW)

    expect(publisher.sent).toHaveLength(120)
  })

  it('keeps retrying through a long outage instead of giving up', async () => {
    const world = build()
    await graded(world)
    const { useCase, publisher, publications } = make(
      world,
      new FakePublisher(() => ({ result: 'RETRY', reason: 'down' })),
    )

    for (let attempt = 0; attempt < 15; attempt += 1) {
      await useCase.execute(new Date(NOW.getTime() + attempt * 3 * 3_600_000))
    }

    expect(publisher.sent).toHaveLength(15)
    expect(world.sessions.publications.get('ses-1')).toBe('PENDING')
    expect(publications.states.get('ses-1')?.permanentFailures).toBe(0)
  })

  it('does not overwrite a regrade that happened while the score was being sent', async () => {
    const world = build()
    await graded(world)
    const regrade = () => {
      const session = world.sessions.sessions.get('ses-1')!
      world.sessions.sessions.set('ses-1', {
        ...session,
        rawScore: 14,
        gradedAt: new Date(NOW.getTime() + 5_000),
      })
      world.sessions.publications.set('ses-1', 'PENDING')
    }
    const { useCase, publications } = make(
      world,
      new FakePublisher(() => ({ result: 'SENT' }), regrade),
    )

    await useCase.execute(NOW)

    expect(world.sessions.publications.get('ses-1')).toBe('PENDING')
    expect(publications.states.get('ses-1')?.sentAt).toBeNull()
  })

  it('does not count a failed attempt of an outdated score', async () => {
    const world = build()
    await graded(world)
    const regrade = () => {
      const session = world.sessions.sessions.get('ses-1')!
      world.sessions.sessions.set('ses-1', {
        ...session,
        gradedAt: new Date(NOW.getTime() + 5_000),
      })
    }
    const { useCase, publications } = make(
      world,
      new FakePublisher(() => ({ result: 'RETRY', reason: 'down' }), regrade),
    )

    await useCase.execute(NOW)

    expect(publications.states.get('ses-1')?.attempts ?? 0).toBe(0)
  })

  it('publishes a student who left the class after the exam from the enrollment stored at the start', async () => {
    const world = build()
    await graded(world)
    world.sessions.sessions.set('ses-1', {
      ...world.sessions.sessions.get('ses-1')!,
      enrollmentId: 'enr-at-start',
    })
    const { useCase, publisher } = make(
      world,
      undefined,
      new FakeEnrollment({ enrollment: null }),
    )

    await useCase.execute(NOW)

    expect(publisher.sent[0].enrollmentId).toBe('enr-at-start')
    expect(world.sessions.publications.get('ses-1')).toBe('SENT')
  })

  it('still sends the score when the student name cannot be looked up', async () => {
    const world = build()
    await graded(world)
    world.students.refsByIds = () =>
      Promise.reject(new Error('student-service down'))
    const { useCase, publisher } = make(world)

    await useCase.execute(NOW)

    expect(publisher.sent[0]).toMatchObject({
      studentName: null,
      studentNis: null,
    })
    expect(world.sessions.publications.get('ses-1')).toBe('SENT')
  })
})
