import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  OPTION_LISTS,
  type OptionListKey,
  type OptionRef,
} from './option-lists.js'
import {
  GradeRef,
  IReferenceLookupPort,
  NamedRef,
} from './reference-lookup.port.js'

const URL_KEY = 'ACADEMIC_SERVICE_URL'
const IDENTITY_URL_KEY = 'IDENTITY_SERVICE_URL'

@Injectable()
export class HttpReferenceLookupAdapter extends IReferenceLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async listAcademicYears(ids: string[]): Promise<NamedRef[]> {
    return this.batch(ids, '/academic-years/by-ids', toNamedRef)
  }

  async listOccupations(ids: string[]): Promise<NamedRef[]> {
    return this.batch(ids, '/occupations/by-ids', toNamedRef)
  }

  async listEducations(ids: string[]): Promise<NamedRef[]> {
    return this.batch(ids, '/educations/by-ids', toNamedRef)
  }

  async listReligions(ids: string[]): Promise<NamedRef[]> {
    return this.batch(ids, '/religions/by-ids', toNamedRef, IDENTITY_URL_KEY)
  }

  async activeReligions(): Promise<OptionRef[]> {
    return this.active(IDENTITY_URL_KEY, '/religions/active', toOptionRef)
  }

  async activeGrades(): Promise<GradeRef[]> {
    return this.active(URL_KEY, '/grades/active', toGradeRef)
  }

  async listGrades(ids: string[]): Promise<GradeRef[]> {
    return this.batch(ids, '/grades/by-ids', toGradeRef)
  }

  async activeOptions(key: OptionListKey): Promise<OptionRef[]> {
    return this.active(URL_KEY, `/${OPTION_LISTS[key]}/active`, toOptionRef)
  }

  async optionsByIds(key: OptionListKey, ids: string[]): Promise<OptionRef[]> {
    return this.batch(ids, `/${OPTION_LISTS[key]}/by-ids`, toOptionRef)
  }

  private async active<T>(
    urlKey: string,
    path: string,
    parse: (row: unknown) => T | null,
  ): Promise<T[]> {
    const data = await this.client.getData(urlKey, path)
    if (!Array.isArray(data)) return this.client.malformed(urlKey)
    const rows: T[] = []
    for (const row of data) {
      const parsed = parse(row)
      if (!parsed) return this.client.malformed(urlKey)
      rows.push(parsed)
    }
    return rows
  }

  private async batch<T>(
    ids: string[],
    path: string,
    parse: (row: unknown) => T | null,
    urlKey: string = URL_KEY,
  ): Promise<T[]> {
    const unique = [...new Set(ids)]
    if (unique.length === 0) return []

    const data = await this.client.postData(urlKey, path, { ids: unique })
    if (!Array.isArray(data)) return this.client.malformed(urlKey)

    const rows: T[] = []
    for (const row of data) {
      const parsed = parse(row)
      if (!parsed) return this.client.malformed(urlKey)
      rows.push(parsed)
    }
    return rows
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function toNamedRef(row: unknown): NamedRef | null {
  if (!isRecord(row) || typeof row.id !== 'string') return null
  if (typeof row.name !== 'string') return null
  return { id: row.id, name: row.name }
}

function toGradeRef(row: unknown): GradeRef | null {
  if (!isRecord(row)) return null
  const { id, level, name } = row
  if (typeof id !== 'string' || typeof level !== 'number') return null
  return { id, level, name: typeof name === 'string' ? name : null }
}

function toOptionRef(row: unknown): OptionRef | null {
  const ref = toNamedRef(row)
  if (!ref || typeof (row as Record<string, unknown>).isActive !== 'boolean')
    return null
  return {
    ...ref,
    isActive: (row as Record<string, unknown>).isActive as boolean,
  }
}
