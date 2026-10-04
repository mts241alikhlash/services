export interface Semester {
  id: string
  academicYearId: string
  typeId: string
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
  deletedAt: Date | null
}

export interface SemesterWithDetails extends Semester {
  academicYear: { id: string; name: string }
  type: { id: string; name: string; sequence: number }

  _count?: {
    enrollments: number
    teachingAssignments: number
  }
}
