import { ServiceUnavailableException } from '@nestjs/common'
import type { ServiceClient } from '../service-client/service-client.js'
import { HttpScorePublisherAdapter } from './http-score-publisher.adapter.js'
import type { ExamScorePayload } from './score-publisher.port.js'

const payload: ExamScorePayload = {
  examSessionId: 's1',
  enrollmentId: 'e1',
  studentId: 'st1',
  studentName: 'Ahmad Fauzi',
  studentNis: '2024001',
  subjectId: 'sub1',
  gradeId: 'g1',
  classroomId: 'c1',
  semesterId: 'sem1',
  examTitle: 'UTS',
  rawScore: 8,
  maxScore: 10,
  score: 80,
  gradedAt: '2026-11-02T03:00:00.000Z',
}

const build = (status: number | Error) => {
  const postStatus = jest.fn(() =>
    status instanceof Error ? Promise.reject(status) : Promise.resolve(status),
  )
  return {
    adapter: new HttpScorePublisherAdapter({
      postStatus,
    } as unknown as ServiceClient),
    postStatus,
  }
}

describe('HttpScorePublisherAdapter.publish', () => {
  it('posts the score to assessment-service and reports SENT on 2xx', async () => {
    const { adapter, postStatus } = build(200)

    await expect(adapter.publish(payload)).resolves.toEqual({ result: 'SENT' })
    expect(postStatus).toHaveBeenCalledWith(
      'ASSESSMENT_SERVICE_URL',
      '/exam-scores',
      payload,
    )
  })

  it.each([0, 429, 500, 502, 503])(
    'answers RETRY for status %s',
    async (status) => {
      const { adapter } = build(status)

      await expect(adapter.publish(payload)).resolves.toMatchObject({
        result: 'RETRY',
      })
    },
  )

  it.each([400, 401, 403, 404, 422])(
    'answers REJECTED with the reason for status %s',
    async (status) => {
      const { adapter } = build(status)

      const outcome = await adapter.publish(payload)

      expect(outcome).toMatchObject({ result: 'REJECTED' })
      expect((outcome as { reason: string }).reason).toContain(String(status))
    },
  )

  it('answers RETRY when the client cannot be configured or reached', async () => {
    const { adapter } = build(new ServiceUnavailableException('down'))

    await expect(adapter.publish(payload)).resolves.toMatchObject({
      result: 'RETRY',
    })
  })
})
