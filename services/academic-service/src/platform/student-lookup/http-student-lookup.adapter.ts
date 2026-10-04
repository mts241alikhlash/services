import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IStudentLookupPort, StudentRef } from './student-lookup.port.js'

const URL_KEY = 'STUDENT_SERVICE_URL'

@Injectable()
export class HttpStudentLookupAdapter extends IStudentLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async listByIds(ids: string[]): Promise<StudentRef[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/students/by-ids', {
      ids: [...new Set(ids)],
    })
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    const rows: StudentRef[] = []
    for (const row of data) {
      const parsed = toStudentRef(row)
      if (!parsed) return this.client.malformed(URL_KEY)
      rows.push(parsed)
    }
    return rows
  }
}

function toStudentRef(row: unknown): StudentRef | null {
  if (row === null || typeof row !== 'object') return null
  const record = row as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    typeof record.userId !== 'string' ||
    typeof record.nis !== 'string'
  ) {
    return null
  }
  return { id: record.id, userId: record.userId, nis: record.nis }
}
