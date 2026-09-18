import {
  AttendanceRecap,
  ClassroomRef,
  LatestScoreRow,
  LessonRow,
  ReportCardRef,
  SupervisedClassroom,
  TeachingLoad,
  UngradedAssessmentRow,
} from '../repositories/my-dashboard.repository.js'

export interface MyStudentDashboard {
  classroom: ClassroomRef | null
  todayLessons: LessonRow[]
  attendance: AttendanceRecap
  latestScores: LatestScoreRow[]
  latestReportCard: ReportCardRef | null
}

export interface MyEmployeeDashboard {
  todayLessons: LessonRow[]
  load: TeachingLoad
  supervisedClassrooms: SupervisedClassroom[]
  ungradedAssessments: UngradedAssessmentRow[]
  ungradedTotal: number
}

export interface MyDashboardResult {
  semester: { id: string; name: string } | null
  today: { date: string; isWeeklyHoliday: boolean }
  student: MyStudentDashboard | null
  employee: MyEmployeeDashboard | null
}
