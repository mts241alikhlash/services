import { Injectable } from '@nestjs/common'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import {
  IScheduleRepository,
  ScheduleWithDetails,
} from '../../../domain/repositories/schedule.repository.js'

export interface MyScheduleResult {
  classroom: ScheduleWithDetails[]
  teaching: ScheduleWithDetails[]
}

const SCHEDULE_PAGE_CEILING = 200

@Injectable()
export class GetMyScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
    private readonly studentIdentity: IStudentIdentityReadPort,
    private readonly employeeIdentity: IEmployeeIdentityReadPort,
  ) {}

  async execute(userId: string): Promise<MyScheduleResult> {
    const [studentId, employeeId] = await Promise.all([
      this.studentIdentity.findStudentIdByUserId(userId),
      this.employeeIdentity.findEmployeeIdByUserId(userId),
    ])

    const [classroom, teaching] = await Promise.all([
      this.classroomSchedule(studentId),
      this.teachingSchedule(employeeId),
    ])

    return { classroom, teaching }
  }

  private async classroomSchedule(
    studentId: string | null,
  ): Promise<ScheduleWithDetails[]> {
    if (!studentId) return []

    const classroomId =
      await this.enrollmentLookup.findActiveClassroomId(studentId)
    if (!classroomId) return []

    return this.scheduleRepository.findByClassroom(classroomId)
  }

  private async teachingSchedule(
    employeeId: string | null,
  ): Promise<ScheduleWithDetails[]> {
    if (!employeeId) return []

    const { data } = await this.scheduleRepository.findAll({
      page: 1,
      limit: SCHEDULE_PAGE_CEILING,
      employeeId,
    })
    return data
  }
}
