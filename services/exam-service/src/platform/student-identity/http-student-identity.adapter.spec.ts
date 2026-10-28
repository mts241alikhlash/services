import { ServiceUnavailableException } from '@nestjs/common'
import type { ServiceClient } from '../service-client/service-client.js'
import { HttpStudentIdentityAdapter } from './http-student-identity.adapter.js'

function build(answer: unknown) {
  const getData = jest.fn((_key: string, _path: string) =>
    Promise.resolve(answer),
  )
  const malformed = jest.fn((): never => {
    throw new ServiceUnavailableException('malformed')
  })
  const client = { getData, malformed } as unknown as ServiceClient
  return { adapter: new HttpStudentIdentityAdapter(client), getData }
}

describe('HttpStudentIdentityAdapter', () => {
  it('asks student-service which student the user is', async () => {
    const { adapter, getData } = build({ studentId: 'stu-1' })

    await expect(adapter.findStudentIdByUserId('user 1')).resolves.toBe('stu-1')
    expect(getData).toHaveBeenCalledWith(
      'STUDENT_SERVICE_URL',
      '/students/by-user/user%201',
    )
  })

  it('answers null for an account that is not a student', async () => {
    await expect(
      build({ studentId: null }).adapter.findStudentIdByUserId('u'),
    ).resolves.toBeNull()
    await expect(
      build(null).adapter.findStudentIdByUserId('u'),
    ).resolves.toBeNull()
  })

  it('treats an answer of the wrong shape as malformed', async () => {
    await expect(
      build({ studentId: 42 }).adapter.findStudentIdByUserId('u'),
    ).rejects.toThrow('malformed')
  })
})
