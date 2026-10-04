import { Injectable } from '@nestjs/common'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import {
  IMyDashboardRepository,
  LessonRow,
} from '../../../domain/repositories/my-dashboard.repository.js'
import {
  LATEST_SCORE_LIMIT,
  UNGRADED_ASSESSMENT_LIMIT,
  WEEKDAY_TO_SCHEDULE_DAY,
} from '../../../constants/my-dashboard.constants.js'
import { MyDashboardResult } from '../../../domain/entities/my-dashboard.entity.js'

@Injectable()
export class GetMyDashboardUseCase {
  constructor(
    private readonly repository: IMyDashboardRepository,
    private readonly studentIdentity: IStudentIdentityReadPort,
    private readonly employeeIdentity: IEmployeeIdentityReadPort,
    private readonly academicLookup: IAcademicLookupPort,
  ) {}

  async execute(userId: string): Promise<MyDashboardResult> {
    const [studentId, employeeId, semester, setting] = await Promise.all([
      this.studentIdentity.findStudentIdByUserId(userId),
      this.employeeIdentity.findEmployeeIdByUserId(userId),
      this.repository.findActiveSemester(),
      this.academicLookup.findSetting(),
    ])

    const today = new Date()
    const weeklyHolidays = setting?.weeklyHolidays ?? []
    const isWeeklyHoliday = weeklyHolidays.includes(today.getDay())
    const scheduleDay = WEEKDAY_TO_SCHEDULE_DAY[today.getDay()] ?? null

    const [student, employee] = await Promise.all([
      this.studentHalf(studentId, semester?.id ?? null, scheduleDay),
      this.employeeHalf(employeeId, semester?.id ?? null, scheduleDay),
    ])

    return {
      semester: semester ? { id: semester.id, name: semester.name } : null,
      today: { date: today.toISOString().slice(0, 10), isWeeklyHoliday },
      student,
      employee,
    }
  }

  private async studentHalf(
    studentId: string | null,
    semesterId: string | null,
    day: ReturnType<() => (typeof WEEKDAY_TO_SCHEDULE_DAY)[number]>,
  ): Promise<MyDashboardResult['student']> {
    if (!studentId) return null

    const enrolment = semesterId
      ? await this.repository.findEnrolledClassroom(studentId, semesterId)
      : null

    const [lessons, attendance, latestScores, reportCard] = await Promise.all([
      enrolment && day
        ? this.repository.findClassroomLessons(enrolment.classroom.id, day)
        : Promise.resolve<LessonRow[]>([]),
      enrolment
        ? this.repository.summariseAttendance(enrolment.enrollmentId)
        : Promise.resolve({
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            sick: 0,
          }),
      enrolment
        ? this.repository.findLatestScores(
            enrolment.enrollmentId,
            LATEST_SCORE_LIMIT,
          )
        : Promise.resolve([]),
      this.repository.findLatestPublishedReportCard(studentId),
    ])

    return {
      classroom: enrolment?.classroom ?? null,
      todayLessons: lessons,
      attendance,
      latestScores,
      latestReportCard: reportCard,
    }
  }

  private async employeeHalf(
    employeeId: string | null,
    semesterId: string | null,
    day: ReturnType<() => (typeof WEEKDAY_TO_SCHEDULE_DAY)[number]>,
  ): Promise<MyDashboardResult['employee']> {
    if (!employeeId) return null

    const [lessons, load, supervised, ungraded] = await Promise.all([
      day
        ? this.repository.findTeachingLessons(employeeId, day)
        : Promise.resolve<LessonRow[]>([]),
      semesterId
        ? this.repository.summariseTeachingLoad(employeeId, semesterId)
        : Promise.resolve({ classroomCount: 0, subjectCount: 0 }),
      semesterId
        ? this.repository.findSupervisedClassrooms(employeeId, semesterId)
        : Promise.resolve([]),
      semesterId
        ? this.repository.findUngradedAssessments(
            employeeId,
            semesterId,
            UNGRADED_ASSESSMENT_LIMIT,
          )
        : Promise.resolve({ rows: [], total: 0 }),
    ])

    return {
      todayLessons: lessons,
      load,
      supervisedClassrooms: supervised,
      ungradedAssessments: ungraded.rows,
      ungradedTotal: ungraded.total,
    }
  }
}
