import { ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpIdentityAdapter } from './http-identity.adapter.js'

const active = {
  active: true,
  userId: 'user-1',
  identifier: 'operator',
  sessionId: 'session-1',
  roles: ['STAFF'],
  permissions: ['assets.read'],
}

describe('HttpIdentityAdapter', () => {
  const fetchMock = jest.fn<
    ReturnType<typeof fetch>,
    Parameters<typeof fetch>
  >()
  let adapter: HttpIdentityAdapter

  beforeEach(() => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)
    fetchMock.mockReset()
    adapter = new HttpIdentityAdapter(
      new ConfigService({
        IDENTITY_SERVICE_URL: 'https://identity.internal/',
        IDENTITY_CACHE_TTL_MS: 5000,
        IDENTITY_CACHE_MAX_ENTRIES: 1,
        IDENTITY_MAX_CONCURRENT_REQUESTS: 1,
      }),
    )
  })

  afterEach(() => jest.restoreAllMocks())

  function answer(data: object) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data })))
  }

  it('coalesces concurrent requests and caches a validated identity', async () => {
    answer(active)
    const results = await Promise.all([
      adapter.resolve('token'),
      adapter.resolve('token'),
    ])
    expect(results[0]?.userId).toBe('user-1')
    expect(results[1]).toEqual(results[0])
    await adapter.resolve('token')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://identity.internal/auth/introspect',
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        signal: expect.any(AbortSignal),
        body: JSON.stringify({ token: 'token' }),
      }),
    )
  })

  it('caches explicit inactive responses', async () => {
    answer({ active: false })
    expect(await adapter.resolve('token')).toBeNull()
    expect(await adapter.resolve('token')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    {},
    { active: 'true' },
    { ...active, permissions: 'assets.read' },
    { ...active, sessionId: '' },
  ])('fails closed for malformed contracts: %j', async (body) => {
    answer(body)
    await expect(adapter.resolve('token')).rejects.toThrow(
      ServiceUnavailableException,
    )
    answer(active)
    expect(await adapter.resolve('token')).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns 503 for network failures and allows recovery', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network failure'))
    await expect(adapter.resolve('token')).rejects.toThrow(
      ServiceUnavailableException,
    )
    answer(active)
    expect(await adapter.resolve('token')).not.toBeNull()
  })

  it('returns 503 for invalid JSON and server errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response('invalid'))
    await expect(adapter.resolve('token')).rejects.toThrow(
      ServiceUnavailableException,
    )
    fetchMock.mockResolvedValueOnce(
      new Response('unavailable', { status: 503 }),
    )
    await expect(adapter.resolve('token')).rejects.toThrow(
      ServiceUnavailableException,
    )
  })

  it('evicts old entries at the configured capacity', async () => {
    answer(active)
    await adapter.resolve('first')
    answer(active)
    await adapter.resolve('second')
    answer(active)
    await adapter.resolve('first')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('expires cached grants without extending their TTL', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000)
    answer(active)
    await adapter.resolve('token')
    clock.mockReturnValue(6000)
    answer({ active: false })
    expect(await adapter.resolve('token')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('refuses excess distinct requests while another verification is pending', async () => {
    let complete: (response: Response) => void = () => undefined
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          complete = resolve
        }),
    )
    const first = adapter.resolve('first')
    await expect(adapter.resolve('second')).rejects.toThrow(
      ServiceUnavailableException,
    )
    complete(new Response(JSON.stringify({ data: active })))
    await first
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not expose mutable cached permissions', async () => {
    answer(active)
    const result = await adapter.resolve('token')
    result?.permissions.push('assets.delete')
    expect((await adapter.resolve('token'))?.permissions).toEqual([
      'assets.read',
    ])
  })

  it('aborts a stalled dependency at the configured timeout', async () => {
    adapter = new HttpIdentityAdapter(
      new ConfigService({
        IDENTITY_SERVICE_URL: 'https://identity.internal',
        IDENTITY_TIMEOUT_MS: 10,
      }),
    )
    fetchMock.mockImplementationOnce(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new TypeError('aborted')),
            { once: true },
          )
        }),
    )
    await expect(adapter.resolve('token')).rejects.toThrow(
      ServiceUnavailableException,
    )
  })

  it('disables response caching when TTL is zero', async () => {
    adapter = new HttpIdentityAdapter(
      new ConfigService({
        IDENTITY_SERVICE_URL: 'https://identity.internal',
        IDENTITY_CACHE_TTL_MS: 0,
      }),
    )
    answer(active)
    await adapter.resolve('token')
    answer({ active: false })
    expect(await adapter.resolve('token')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
