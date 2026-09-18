export interface GradeRef {
  id: string
  level: number
  name: string
  isActive: boolean
  deletedAt: Date | null
}

export interface AcademicYearRef {
  id: string
  name: string
}

export interface SemesterRef {
  id: string
  academicYearId: string
  typeId: string
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
  deletedAt: Date | null
  academicYear?: AcademicYearRef
}

export interface ClassroomRef {
  id: string
  code: string
  name: string | null
  gradeId: string
  academicYearId: string
  capacity: number
  grade?: GradeRef
}

export interface SubjectRef {
  id: string
  code: string | null
  name: string
}

export interface NamedRef {
  id: string
  name: string
}

export interface CodedRef extends NamedRef {
  code: string
}
