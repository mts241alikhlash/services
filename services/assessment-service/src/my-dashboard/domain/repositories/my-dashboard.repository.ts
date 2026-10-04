import { DayEnum } from '../../../shared/domain/enums/day.enum.js'

export interface ActiveSemesterRef {
  id: string
  name: string
  academicYearId: string
}

export interface ClassroomRef {
  id: string
  code: string
  name: string | null
}

export interface LessonRow {
  id: string
  startTime: string
  endTime: string
  subjectName: string
  classroomCode: string | null
  employeeName: string | null
  room: string | null
}

export interface AttendanceRecap {
  present: number
  absent: number
  late: number
  excused: number
  sick: number
}

export interface LatestScoreRow {
  id: string
  subjectName: string
  assessmentName: string
  score: number | null
  maxScore: number
}

export interface ReportCardRef {
  id: string
  semesterName: string
}

export interface TeachingLoad {
  classroomCount: number
  subjectCount: number
}

export interface SupervisedClassroom extends ClassroomRef {
  studentCount: number
}

export interface UngradedAssessmentRow {
  id: string
  name: string
  subjectName: string
  classroomCode: string
  gradedCount: number
  studentCount: number
}

export abstract class IMyDashboardRepository {
  abstract findActiveSemester(): Promise<ActiveSemesterRef | null>

  abstract findEnrolledClassroom(
    studentId: string,
    semesterId: string,
  ): Promise<{ enrollmentId: string; classroom: ClassroomRef } | null>

  abstract findClassroomLessons(
    classroomId: string,
    day: DayEnum,
  ): Promise<LessonRow[]>

  abstract summariseAttendance(enrollmentId: string): Promise<AttendanceRecap>

  abstract findLatestScores(
    enrollmentId: string,
    limit: number,
  ): Promise<LatestScoreRow[]>

  abstract findLatestPublishedReportCard(
    studentId: string,
  ): Promise<ReportCardRef | null>

  abstract findTeachingLessons(
    employeeId: string,
    day: DayEnum,
  ): Promise<LessonRow[]>

  abstract summariseTeachingLoad(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingLoad>

  abstract findSupervisedClassrooms(
    employeeId: string,
    semesterId: string,
  ): Promise<SupervisedClassroom[]>

  abstract findUngradedAssessments(
    employeeId: string,
    semesterId: string,
    limit: number,
  ): Promise<{ rows: UngradedAssessmentRow[]; total: number }>
}
