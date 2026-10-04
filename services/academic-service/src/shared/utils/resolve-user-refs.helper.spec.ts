import { resolveUserRefs } from './resolve-user-refs.helper.js'
import { IProfileLookupPort } from '../../platform/profile-lookup/profile-lookup.port.js'

describe('resolveUserRefs', () => {
  const mockProfileLookupPort: jest.Mocked<IProfileLookupPort> = {
    findByUserIds: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns an empty map without calling the port when given no ids', async () => {
    const result = await resolveUserRefs([], mockProfileLookupPort)

    expect(result.size).toBe(0)
    expect(mockProfileLookupPort.findByUserIds).not.toHaveBeenCalled()
  })

  it('maps each resolved profile to a UserRef, keyed by userId', async () => {
    mockProfileLookupPort.findByUserIds.mockResolvedValue([
      {
        userId: 'user-1',
        identifier: 'guru001',
        isActive: true,
        name: 'Ahmad Fauzi',
        gender: 'MALE',
        nik: '3578012345678901',
        avatarStorageKey: null,
      },
    ])

    const result = await resolveUserRefs(['user-1'], mockProfileLookupPort)

    expect(result.get('user-1')).toEqual({
      id: 'user-1',
      identifier: 'guru001',
      isActive: true,
      profile: {
        name: 'Ahmad Fauzi',
        gender: 'MALE',
        nik: '3578012345678901',
      },
    })
  })

  it('de-duplicates ids before calling the port', async () => {
    mockProfileLookupPort.findByUserIds.mockResolvedValue([])

    await resolveUserRefs(['user-1', 'user-1', 'user-2'], mockProfileLookupPort)

    expect(mockProfileLookupPort.findByUserIds).toHaveBeenCalledWith([
      'user-1',
      'user-2',
    ])
  })

  it('leaves an id absent from the map when identity-service has no profile for it', async () => {
    mockProfileLookupPort.findByUserIds.mockResolvedValue([])

    const result = await resolveUserRefs(['user-1'], mockProfileLookupPort)

    expect(result.has('user-1')).toBe(false)
  })
})
