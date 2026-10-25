import { ServiceUnavailableException } from '@nestjs/common'
import type { ServiceClient } from '../service-client/service-client.js'
import { HttpAuthorLookupAdapter } from './http-author-lookup.adapter.js'

function build(options: {
  employees?: unknown
  profiles?: unknown
  failHr?: boolean
}) {
  const postData = jest.fn((key: string, path: string, _body: unknown) => {
    if (key === 'HR_SERVICE_URL') {
      return options.failHr
        ? Promise.reject(new ServiceUnavailableException('hr down'))
        : Promise.resolve(options.employees)
    }
    return Promise.resolve(options.profiles)
  })
  const malformed = jest.fn((): never => {
    throw new ServiceUnavailableException('malformed')
  })
  const client = { postData, malformed } as unknown as ServiceClient
  return { adapter: new HttpAuthorLookupAdapter(client), postData }
}

describe('HttpAuthorLookupAdapter', () => {
  it('turns employee ids into names through the account of each employee', async () => {
    const { adapter, postData } = build({
      employees: [
        { id: 'emp-1', userId: 'user-1', nip: null },
        { id: 'emp-2', userId: 'user-2', nip: '12' },
      ],
      profiles: [
        { userId: 'user-1', name: 'Ustadz Ahmad' },
        { userId: 'user-2', name: 'Ustadzah Fatimah' },
      ],
    })

    const names = await adapter.namesOf(['emp-1', 'emp-2', 'emp-1'])

    expect([...names]).toEqual([
      ['emp-1', 'Ustadz Ahmad'],
      ['emp-2', 'Ustadzah Fatimah'],
    ])
    expect(postData).toHaveBeenCalledWith(
      'HR_SERVICE_URL',
      '/employees/by-ids',
      { ids: ['emp-1', 'emp-2'] },
    )
    expect(postData).toHaveBeenCalledWith(
      'IDENTITY_SERVICE_URL',
      '/profiles/batch',
      { userIds: ['user-1', 'user-2'] },
    )
  })

  it('leaves out employees without a profile', async () => {
    const { adapter } = build({
      employees: [{ id: 'emp-1', userId: 'user-1', nip: null }],
      profiles: [],
    })

    expect((await adapter.namesOf(['emp-1'])).size).toBe(0)
  })

  it('does not call anyone for no ids', async () => {
    const { adapter, postData } = build({})

    expect((await adapter.namesOf([])).size).toBe(0)
    expect(postData).not.toHaveBeenCalled()
  })

  it('returns no names rather than failing when a service is down', async () => {
    const { adapter } = build({ failHr: true })

    expect((await adapter.namesOf(['emp-1'])).size).toBe(0)
  })
})
