import { ServiceUnavailableException } from '@nestjs/common'
import type { ServiceClient } from '../service-client/service-client.js'
import { HttpStudentDirectoryAdapter } from './http-student-directory.adapter.js'

function build(students: unknown, profiles: unknown) {
  const postData = jest.fn((key: string) =>
    Promise.resolve(key === 'STUDENT_SERVICE_URL' ? students : profiles),
  )
  const malformed = jest.fn((): never => {
    throw new ServiceUnavailableException('malformed')
  })
  const client = { postData, malformed } as unknown as ServiceClient
  return { adapter: new HttpStudentDirectoryAdapter(client), postData }
}

describe('HttpStudentDirectoryAdapter.refsByIds', () => {
  it('joins the student with the profile name of its account', async () => {
    const { adapter, postData } = build(
      { data: [{ id: 's1', userId: 'u1', nis: '2024001' }] },
      [{ userId: 'u1', name: 'Ahmad Fauzi' }],
    )

    await expect(adapter.refsByIds(['s1'])).resolves.toEqual([
      { id: 's1', nis: '2024001', name: 'Ahmad Fauzi' },
    ])
    expect(postData).toHaveBeenCalledWith(
      'STUDENT_SERVICE_URL',
      '/students/by-ids',
      { ids: ['s1'] },
    )
    expect(postData).toHaveBeenCalledWith(
      'IDENTITY_SERVICE_URL',
      '/profiles/batch',
      { userIds: ['u1'] },
    )
  })

  it('accepts a plain array from the student service', async () => {
    const { adapter } = build(
      [{ id: 's1', userId: 'u1', nis: '1' }],
      [{ userId: 'u1', name: 'A' }],
    )

    await expect(adapter.refsByIds(['s1'])).resolves.toHaveLength(1)
  })

  it('keeps a student whose profile is missing with a null name', async () => {
    const { adapter } = build(
      { data: [{ id: 's1', userId: 'u1', nis: '1' }] },
      [],
    )

    await expect(adapter.refsByIds(['s1'])).resolves.toEqual([
      { id: 's1', nis: '1', name: null },
    ])
  })

  it('drops ids the student service does not know', async () => {
    const { adapter } = build({ data: [] }, [])

    await expect(adapter.refsByIds(['gone'])).resolves.toEqual([])
  })

  it('does not call anything for an empty list', async () => {
    const { adapter, postData } = build({ data: [] }, [])

    await expect(adapter.refsByIds([])).resolves.toEqual([])
    expect(postData).not.toHaveBeenCalled()
  })

  it('fails closed on a malformed answer', async () => {
    const { adapter } = build({ nope: true }, [])

    await expect(adapter.refsByIds(['s1'])).rejects.toThrow(
      ServiceUnavailableException,
    )
  })
})
