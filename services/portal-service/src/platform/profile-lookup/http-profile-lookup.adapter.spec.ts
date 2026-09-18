import { ConfigService } from '@nestjs/config'
import { ServiceUnavailableException } from '@nestjs/common'
import { HttpProfileLookupAdapter } from './http-profile-lookup.adapter.js'

describe('Profile lookup boundary', () => {
  const fetchMock = jest.fn<
    ReturnType<typeof fetch>,
    Parameters<typeof fetch>
  >()
  let adapter: HttpProfileLookupAdapter
  beforeEach(() => {
    fetchMock.mockReset()
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)
    adapter = new HttpProfileLookupAdapter(
      new ConfigService({
        IDENTITY_SERVICE_URL: 'https://identity.internal',
        PROVISIONING_SERVICE_TOKEN: 'test-only-token',
        PROFILE_LOOKUP_CACHE_MAX_ENTRIES: 1,
      }),
    )
  })
  afterEach(() => jest.restoreAllMocks())

  function reply(data: object) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data })))
  }

  it('retains only byline fields and caches without aliasing', async () => {
    reply([
      {
        userId: 'one',
        identifier: 'author',
        name: 'Author',
        nik: 'private',
        email: 'private',
      },
    ])
    const profiles = await adapter.findByUserIds(['one', 'one'])
    expect(profiles).toEqual([
      { userId: 'one', identifier: 'author', name: 'Author' },
    ])
    profiles[0].name = 'Changed'
    expect((await adapter.findByUserIds(['one']))[0].name).toBe('Author')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    {},
    [{ userId: 'one' }],
    [{ userId: 'other', identifier: '', name: '' }],
  ])(
    'rejects invalid or unexpected profiles and does not cache them',
    async (body) => {
      reply(body)
      await expect(adapter.findByUserIds(['one'])).rejects.toThrow(
        ServiceUnavailableException,
      )
      reply([])
      expect(await adapter.findByUserIds(['one'])).toEqual([])
      expect(fetchMock).toHaveBeenCalledTimes(2)
    },
  )

  it('distinguishes broken JSON from a successful empty lookup', async () => {
    fetchMock.mockResolvedValueOnce(new Response('invalid'))
    await expect(adapter.findByUserIds(['one'])).rejects.toThrow(
      ServiceUnavailableException,
    )
    reply([])
    await adapter.findByUserIds(['one'])
    await adapter.findByUserIds(['one'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('evicts at capacity', async () => {
    reply([])
    await adapter.findByUserIds(['one'])
    reply([])
    await adapter.findByUserIds(['two'])
    reply([])
    await adapter.findByUserIds(['one'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('splits requests at the producer limit of 200 IDs', async () => {
    reply([])
    reply([])
    await adapter.findByUserIds(
      Array.from({ length: 201 }, (_, index) => String(index)),
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ userIds: ['200'] }),
    )
  })
})
