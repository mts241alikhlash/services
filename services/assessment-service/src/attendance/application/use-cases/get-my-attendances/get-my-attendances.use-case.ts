import { Injectable } from '@nestjs/common'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import { GetAttendancesUseCase } from '../get-attendances/get-attendances.use-case.js'
import type { GetAttendancesInput } from '../get-attendances/get-attendances.input.js'

@Injectable()
export class GetMyAttendancesUseCase {
  constructor(
    private readonly getAttendances: GetAttendancesUseCase,
    private readonly studentIdentity: IStudentIdentityReadPort,
  ) {}

  async execute(input: GetAttendancesInput, userId: string) {
    const studentId = await this.studentIdentity.findStudentIdByUserId(userId)

    if (!studentId) {
      return {
        data: [],
        total: 0,
        page: input.page ?? 1,
        limit: input.limit ?? 10,
      }
    }

    return this.getAttendances.execute(input, { studentId })
  }
}
