export interface BulkGraduateStudentsStudentInput {
  studentId: string
  certificateNo?: string
  note?: string
}

export interface BulkGraduateStudentsHeldInput {
  studentId: string
  reason: string
}

export interface BulkGraduateStudentsInput {
  graduationDate?: string
  students: BulkGraduateStudentsStudentInput[]
  held?: BulkGraduateStudentsHeldInput[]
}
