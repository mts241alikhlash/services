import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  IStudentDirectoryPort,
  type StudentRef,
} from './student-directory.port.js'

const STUDENT_URL = 'STUDENT_SERVICE_URL'
const IDENTITY_URL = 'IDENTITY_SERVICE_URL'

interface StudentRow {
  id: string
  userId: string
  nis: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

@Injectable()
export class HttpStudentDirectoryAdapter extends IStudentDirectoryPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async refsByIds(ids: string[]): Promise<StudentRef[]> {
    if (ids.length === 0) return []

    const students = this.studentRows(
      await this.client.postData(STUDENT_URL, '/students/by-ids', { ids }),
    )
    if (students.length === 0) return []

    const profiles = await this.client.postData(
      IDENTITY_URL,
      '/profiles/batch',
      { userIds: students.map((student) => student.userId) },
    )
    const names = new Map<string, string>()
    if (Array.isArray(profiles)) {
      for (const row of profiles as unknown[]) {
        if (
          isRecord(row) &&
          typeof row.userId === 'string' &&
          typeof row.name === 'string'
        ) {
          names.set(row.userId, row.name)
        }
      }
    }

    return students.map((student) => ({
      id: student.id,
      nis: student.nis,
      name: names.get(student.userId) ?? null,
    }))
  }

  private studentRows(data: unknown): StudentRow[] {
    const rows = Array.isArray(data)
      ? (data as unknown[])
      : isRecord(data) && Array.isArray(data.data)
        ? (data.data as unknown[])
        : this.client.malformed(STUDENT_URL)

    return rows.map((row) => {
      if (
        !isRecord(row) ||
        typeof row.id !== 'string' ||
        typeof row.userId !== 'string' ||
        typeof row.nis !== 'string'
      ) {
        return this.client.malformed(STUDENT_URL)
      }
      return { id: row.id, userId: row.userId, nis: row.nis }
    })
  }
}
