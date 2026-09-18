import { ConflictException, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { HttpAccountProvisioningAdapter } from './http-account-provisioning.adapter.js'

describe('HttpAccountProvisioningAdapter', () => {
  let adapter: HttpAccountProvisioningAdapter
  let config: { get: jest.Mock }
  let fetchMock: jest.Mock

  const input = {
    identifier: 'guru001',
    passwordHash: 'hashed',
    roleCode: 'EMPLOYEE',
    profile: {
      name: 'Budi Santoso',
      nik: '3578010101700001',
      gender: UserGender.MALE,
      birthPlace: 'Surabaya',
      birthDate: new Date('1980-06-15'),
    },
  }

  beforeEach(() => {
    config = {
      get: jest.fn((key: string) =>
        key === 'IDENTITY_SERVICE_URL'
          ? 'https://identity.internal'
          : 'the-shared-secret',
      ),
    }
    fetchMock = jest.fn()
    global.fetch = fetchMock as typeof fetch
    adapter = new HttpAccountProvisioningAdapter(
      config as unknown as ConfigService,
    )
  })

  describe('provision', () => {
    it('posts to /accounts and returns the created account id', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: { id: 'u-1' } }),
      })

      const result = await adapter.provision(input)

      expect(result).toEqual({ id: 'u-1' })
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://identity.internal/accounts')
      expect(init.method).toBe('POST')
      expect(
        (init.headers as Record<string, string>)['x-provisioning-token'],
      ).toBe('the-shared-secret')
      expect(JSON.parse(init.body as string)).toEqual(
        JSON.parse(JSON.stringify(input)),
      )
    })

    it('throws ServiceUnavailableException when IDENTITY_SERVICE_URL is not configured', async () => {
      config.get.mockReturnValue(undefined)

      await expect(adapter.provision(input)).rejects.toThrow(
        ServiceUnavailableException,
      )
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('throws ServiceUnavailableException when PROVISIONING_SERVICE_TOKEN is not configured', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'IDENTITY_SERVICE_URL'
          ? 'https://identity.internal'
          : undefined,
      )

      await expect(adapter.provision(input)).rejects.toThrow(
        ServiceUnavailableException,
      )
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('throws ServiceUnavailableException when identity-service is unreachable', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))

      await expect(adapter.provision(input)).rejects.toThrow(
        ServiceUnavailableException,
      )
    })

    it('throws ConflictException when identity-service answers 409', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 409 })

      await expect(adapter.provision(input)).rejects.toThrow(ConflictException)
    })

    it('throws ServiceUnavailableException for any other non-2xx', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 })

      await expect(adapter.provision(input)).rejects.toThrow(
        ServiceUnavailableException,
      )
    })

    it('throws ServiceUnavailableException when the response carries no account id', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: {} }),
      })

      await expect(adapter.provision(input)).rejects.toThrow(
        ServiceUnavailableException,
      )
    })
  })

  describe('deprovision', () => {
    it('sends DELETE to /accounts/:userId', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 204 })

      await adapter.deprovision('u-1')

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://identity.internal/accounts/u-1')
      expect(init.method).toBe('DELETE')
      expect(init.body).toBeUndefined()
    })

    it('throws ServiceUnavailableException when identity-service is unreachable', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))

      await expect(adapter.deprovision('u-1')).rejects.toThrow(
        ServiceUnavailableException,
      )
    })
  })

  describe('setActive', () => {
    it('sends PATCH to /accounts/:userId and returns the account', async () => {
      const createdAt = '2024-01-01T00:00:00.000Z'
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              id: 'u-1',
              identifier: 'guru001',
              isActive: false,
              createdAt,
              updatedAt: createdAt,
            },
          }),
      })

      const result = await adapter.setActive('u-1', false)

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://identity.internal/accounts/u-1')
      expect(init.method).toBe('PATCH')
      expect(JSON.parse(init.body as string)).toEqual({ isActive: false })
      expect(result).toEqual({
        id: 'u-1',
        identifier: 'guru001',
        isActive: false,
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
      })
    })

    it('throws ServiceUnavailableException when the response carries no account', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: null }),
      })

      await expect(adapter.setActive('u-1', false)).rejects.toThrow(
        ServiceUnavailableException,
      )
    })
  })

  describe('updateProfile', () => {
    it('sends PATCH to /accounts/:userId/profile with an ISO birthDate', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              id: 'p-1',
              userId: 'u-1',
              name: 'Budi Santoso Jr.',
              nik: '3578010101700001',
              gender: 'MALE',
              birthPlace: 'Surabaya',
              birthDate: '1980-06-15',
              email: null,
              phone: null,
            },
          }),
      })

      const result = await adapter.updateProfile('u-1', {
        name: 'Budi Santoso Jr.',
        birthDate: new Date('1980-06-15'),
      })

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://identity.internal/accounts/u-1/profile')
      expect(init.method).toBe('PATCH')
      expect(JSON.parse(init.body as string)).toEqual({
        name: 'Budi Santoso Jr.',
        birthDate: '1980-06-15',
      })
      expect(result.birthDate).toEqual(new Date('1980-06-15'))
    })
  })

  describe('lookup', () => {
    it('sends GET to /accounts/lookup with query params', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: { identifierTaken: true, nikOwnerId: null },
          }),
      })

      const result = await adapter.lookup({
        identifier: 'guru001',
        nik: '3578010101700001',
      })

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toBe(
        'https://identity.internal/accounts/lookup?identifier=guru001&nik=3578010101700001',
      )
      expect(init.method).toBe('GET')
      expect(result).toEqual({ identifierTaken: true, nikOwnerId: null })
    })

    it('returns a free result when identity-service answers no body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: null }),
      })

      const result = await adapter.lookup({ identifier: 'guru001' })

      expect(result).toEqual({ identifierTaken: false, nikOwnerId: null })
    })
  })
})
