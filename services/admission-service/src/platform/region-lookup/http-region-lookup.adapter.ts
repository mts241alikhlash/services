import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IRegionLookupPort, type RegionRef } from './region-lookup.port.js'

const IDENTITY_URL_KEY = 'IDENTITY_SERVICE_URL'
const LEVELS = ['PROVINCE', 'REGENCY', 'DISTRICT', 'VILLAGE']

@Injectable()
export class HttpRegionLookupAdapter extends IRegionLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async byCodes(codes: string[]): Promise<RegionRef[]> {
    const unique = [...new Set(codes)]
    if (unique.length === 0) return []
    const data = await this.client.postData(
      IDENTITY_URL_KEY,
      '/regions/by-codes',
      { codes: unique },
    )
    if (!Array.isArray(data)) return this.client.malformed(IDENTITY_URL_KEY)
    const rows: RegionRef[] = []
    for (const row of data) {
      const parsed = toRegionRef(row)
      if (!parsed) return this.client.malformed(IDENTITY_URL_KEY)
      rows.push(parsed)
    }
    return rows
  }
}

function toRegionRef(row: unknown): RegionRef | null {
  if (row === null || typeof row !== 'object') return null
  const { code, name, level, parentCode } = row as Record<string, unknown>
  if (typeof code !== 'string' || typeof name !== 'string') return null
  if (typeof level !== 'string' || !LEVELS.includes(level)) return null
  if (parentCode !== null && typeof parentCode !== 'string') return null
  return { code, name, level: level as RegionRef['level'], parentCode }
}
