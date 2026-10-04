export interface ClassroomWithGrade {
  id: string
  name: string | null
  code?: string | null
  academicYearId?: string
  grade: {
    level: number
    name: string
  }
}

export interface ActiveEnrollmentWithDetails {
  id: string
  studentId: string
  classroomId: string
  semesterId?: string
  student: {
    id: string
    nis: string
    user?: {
      profile?: {
        name?: string
      } | null
    }
  }
  classroom: {
    id: string
    code: string
    grade: {
      level: number
      name: string
    }
  }
  reportCard?: {
    totalAverage?: number | null
  } | null
}

export interface SemesterWithAcademicYear {
  id: string
  academicYearId: string
  academicYear: { id: string; name: string }
}
