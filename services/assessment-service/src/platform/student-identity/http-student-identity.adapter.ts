import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IStudentIdentityReadPort } from './student-identity.port.js'

const URL_KEY = 'STUDENT_SERVICE_URL'

@Injectable()
export class HttpStudentIdentityAdapter extends IStudentIdentityReadPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findStudentIdByUserId(userId: string): Promise<string | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/students/by-user/${encodeURIComponent(userId)}`,
    )
    const studentId =
      data !== null && typeof data === 'object' && 'studentId' in data
        ? (data as Record<string, unknown>).studentId
        : undefined

    if (studentId === null) return null
    if (typeof studentId === 'string') return studentId
    return this.client.malformed(URL_KEY)
  }
}
