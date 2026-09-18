export interface CreateAcademicCalendarInput {
  academicYearId: string
  semesterId?: string
  title: string
  typeId: string
  startDate: string
  endDate: string
  description?: string
  startTime?: string
  endTime?: string
  classroomIds?: string[]
}
