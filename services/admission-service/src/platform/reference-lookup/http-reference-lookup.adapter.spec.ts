import { HttpReferenceLookupAdapter } from './http-reference-lookup.adapter.js'
import type { ServiceClient } from '../service-client/service-client.js'

function build(data: unknown) {
  const client = {
    getData: jest.fn().mockResolvedValue(data),
    postData: jest.fn().mockResolvedValue(data),
    malformed: jest.fn().mockImplementation(() => {
      throw new Error('malformed')
    }),
  }
  return {
    client,
    adapter: new HttpReferenceLookupAdapter(client as unknown as ServiceClient),
  }
}

describe('HttpReferenceLookupAdapter options', () => {
  it('reads the active rows of a list from academic-service', async () => {
    const { adapter, client } = build([
      { id: 'a', name: 'Ojek', isActive: true },
    ])

    const rows = await adapter.activeOptions('transportations')

    expect(client.getData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/transportations/active',
    )
    expect(rows).toEqual([{ id: 'a', name: 'Ojek', isActive: true }])
  })

  it('uses the hyphenated academic path for a multi-word list key', async () => {
    const { adapter, client } = build([])

    await adapter.activeOptions('incomeRanges')

    expect(client.getData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/income-ranges/active',
    )
  })

  it('refuses a malformed row', async () => {
    const { adapter, client } = build([{ id: 'a', isActive: true }])

    await expect(adapter.activeOptions('transportations')).rejects.toThrow(
      'malformed',
    )
    expect(client.malformed).toHaveBeenCalledWith('ACADEMIC_SERVICE_URL')
  })

  it('resolves ids once each through by-ids, keeping the active flag', async () => {
    const { adapter, client } = build([
      { id: 'a', name: 'Ojek', isActive: false },
    ])

    const rows = await adapter.optionsByIds('transportations', ['a', 'a'])

    expect(client.postData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/transportations/by-ids',
      { ids: ['a'] },
    )
    expect(rows).toEqual([{ id: 'a', name: 'Ojek', isActive: false }])
  })

  it('does not call academic-service for an empty id list', async () => {
    const { adapter, client } = build([])

    expect(await adapter.optionsByIds('transportations', [])).toEqual([])
    expect(client.postData).not.toHaveBeenCalled()
  })
})

describe('HttpReferenceLookupAdapter religions', () => {
  it('reads the active religions from identity-service', async () => {
    const { adapter, client } = build([
      { id: 'r', name: 'Islam', isActive: true },
    ])

    const rows = await adapter.activeReligions()

    expect(client.getData).toHaveBeenCalledWith(
      'IDENTITY_SERVICE_URL',
      '/religions/active',
    )
    expect(rows).toEqual([{ id: 'r', name: 'Islam', isActive: true }])
  })
})
