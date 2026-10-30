import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamScheduleRepository } from '../../../../exam-schedule/application/exam-schedule.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import {
  FakeStudentDirectory,
  NOW,
  choiceSpec,
  schedulePaper,
  sessionFor,
} from '../../exam-session.test-support.js'
import { ListScheduleSessionsUseCase } from '../list-schedule-sessions/list-schedule-sessions.use-case.js'
import { ListScheduleStreamsUseCase } from './list-schedule-streams.use-case.js'

const config = {
  getOrThrow: () => 'a'.repeat(48),
  get: (key: string, fallback?: string) =>
    key === 'STREAM_HLS_URL' ? 'https://stream.test' : fallback,
} as unknown as ConfigService

describe('ListScheduleStreamsUseCase', () => {
  async function setup(sessionOverrides: Record<string, unknown> = {}) {
    const packages = new FakeExamPackageRepository()
    const schedules = new FakeExamScheduleRepository(packages)
    const questions = new FakeQuestionRepository()
    const sessions = new FakeExamSessionRepository()
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec('B')],
    )
    sessions.sessions.set(
      'a',
      sessionFor(schedule, { id: 'a', ...sessionOverrides }),
    )
    const listSessions = new ListScheduleSessionsUseCase(
      schedules,
      sessions,
      new FakeStudentDirectory(),
    )
    return {
      scheduleId: schedule.id,
      useCase: new ListScheduleStreamsUseCase(
        listSessions,
        new JwtService(),
        config,
      ),
    }
  }

  it('returns a playback url for a live seat', async () => {
    const { useCase, scheduleId } = await setup({
      status: 'IN_PROGRESS',
      lastSeenAt: new Date(NOW.getTime() - 5_000),
    })

    const [row] = await useCase.execute(scheduleId, NOW)

    expect(row.playbackUrl).toMatch(
      /^https:\/\/stream\.test\/a\/index\.m3u8\?token=/,
    )
  })

  it('withholds the url when the heartbeat is older than a minute', async () => {
    const { useCase, scheduleId } = await setup({
      status: 'IN_PROGRESS',
      lastSeenAt: new Date(NOW.getTime() - 61_000),
    })

    const [row] = await useCase.execute(scheduleId, NOW)

    expect(row.playbackUrl).toBeNull()
  })

  it('withholds the url when the session never streamed', async () => {
    const { useCase, scheduleId } = await setup({
      status: 'IN_PROGRESS',
      lastSeenAt: null,
    })

    const [row] = await useCase.execute(scheduleId, NOW)

    expect(row.playbackUrl).toBeNull()
  })

  it('withholds the url for a session that is no longer running', async () => {
    const { useCase, scheduleId } = await setup({
      status: 'SUBMITTED',
      lastSeenAt: NOW,
    })

    const [row] = await useCase.execute(scheduleId, NOW)

    expect(row.playbackUrl).toBeNull()
  })

  it('reports why the camera is blocked and the violation count', async () => {
    const { useCase, scheduleId } = await setup({
      status: 'IN_PROGRESS',
      cameraBlocked: 'permission',
      violationCount: 2,
    })

    const [row] = await useCase.execute(scheduleId, NOW)

    expect(row.cameraBlocked).toBe('permission')
    expect(row.violationCount).toBe(2)
  })
})
