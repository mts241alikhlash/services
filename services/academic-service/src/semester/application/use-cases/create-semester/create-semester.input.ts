export interface CreateSemesterInput {
  academicYearId: string
  typeId: string
  startDate?: Date
  endDate?: Date
  isActive?: boolean
}
