export interface CreateClassroomInput {
  academicYearId: string
  gradeId: string
  code: string
  name?: string
  capacity: number
  isActive?: boolean
}
