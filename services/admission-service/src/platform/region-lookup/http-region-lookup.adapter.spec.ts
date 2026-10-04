import type { ServiceClient } from '../service-client/service-client.js'
import { HttpRegionLookupAdapter } from './http-region-lookup.adapter.js'

function build(data: unknown) {
  const client = {
    postData: jest.fn().mockResolvedValue(data),
    malformed: jest.fn().mockImplementation(() => {
      throw new Error('malformed')
    }),
  }
  return {
    client,
    adapter: new HttpRegionLookupAdapter(client as unknown as ServiceClient),
  }
}

describe('HttpRegionLookupAdapter', () => {
  it('posts the distinct codes to identity-service and parses the rows', async () => {
    const { adapter, client } = build([
      { code: '32', name: 'JAWA BARAT', level: 'PROVINCE', parentCode: null },
    ])

    const rows = await adapter.byCodes(['32', '32'])

    expect(client.postData).toHaveBeenCalledWith(
      'IDENTITY_SERVICE_URL',
      '/regions/by-codes',
      { codes: ['32'] },
    )
    expect(rows).toEqual([
      { code: '32', name: 'JAWA BARAT', level: 'PROVINCE', parentCode: null },
    ])
  })

  it('skips the call for no codes', async () => {
    const { adapter, client } = build([])

    expect(await adapter.byCodes([])).toEqual([])
    expect(client.postData).not.toHaveBeenCalled()
  })

  it('refuses a malformed row', async () => {
    const { adapter, client } = build([{ code: '32', level: 'PROVINCE' }])

    await expect(adapter.byCodes(['32'])).rejects.toThrow('malformed')
    expect(client.malformed).toHaveBeenCalledWith('IDENTITY_SERVICE_URL')
  })
})
