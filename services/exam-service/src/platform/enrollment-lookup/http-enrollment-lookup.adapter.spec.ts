import { ServiceUnavailableException } from '@nestjs/common'
import type { ServiceClient } from '../service-client/service-client.js'
import { HttpEnrollmentLookupAdapter } from './http-enrollment-lookup.adapter.js'

const summary = {
  id: 'enr-1',
  studentId: 'stu-1',
  classroomId: 'room-7a',
  semesterId: 'sem-1',
}

function build(answer: unknown) {
  const getData = jest.fn((_key: string, _path: string) =>
    Promise.resolve(answer),
  )
  const malformed = jest.fn((): never => {
    throw new ServiceUnavailableException('malformed')
  })
  const client = { getData, malformed } as unknown as ServiceClient
  return { adapter: new HttpEnrollmentLookupAdapter(client), getData }
}

describe('HttpEnrollmentLookupAdapter.findActiveByStudent', () => {
  it('returns the active enrollment of the student', async () => {
    const { adapter, getData } = build({
      ...summary,
      status: 'ACTIVE',
      extra: 1,
    })

    await expect(adapter.findActiveByStudent('stu 1')).resolves.toEqual(summary)
    expect(getData).toHaveBeenCalledWith(
      'STUDENT_SERVICE_URL',
      '/student-enrollments/active/stu%201',
    )
  })

  it('narrows the question to a semester when one is given', async () => {
    const { adapter, getData } = build(summary)

    await adapter.findActiveByStudent('stu-1', 'sem-1')

    expect(getData).toHaveBeenCalledWith(
      'STUDENT_SERVICE_URL',
      '/student-enrollments/active/stu-1?semesterId=sem-1',
    )
  })

  it('answers null when the student has no active enrollment', async () => {
    await expect(
      build(null).adapter.findActiveByStudent('stu-1'),
    ).resolves.toBeNull()
  })

  it('treats a row without a classroom as malformed', async () => {
    await expect(
      build({
        id: 'enr-1',
        studentId: 'stu-1',
        semesterId: 'sem-1',
      }).adapter.findActiveByStudent('stu-1'),
    ).rejects.toThrow('malformed')
  })
})
