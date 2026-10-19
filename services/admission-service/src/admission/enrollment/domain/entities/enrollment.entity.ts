export type EnrollmentTab = 'ready' | 'held' | 'done'

export interface EnrollmentQueueQuery {
  tab: EnrollmentTab
  search?: string
  waveId?: string
  page: number
  limit: number
}

export interface EnrollmentQueueRecord {
  applicationId: string
  registrationNumber: string
  applicantName: string
  waveName: string
  academicYearId: string
  status: string
  admissionType: 'NEW' | 'TRANSFER' | null
  targetGradeLevel: number | null
  nis: string | null
  nisn: string | null
  enrolledStudentId: string | null
}

export interface EnrollmentYearRecord {
  academicYearId: string
  lockedAt: Date | null
}

export interface EnrollmentQueueResult {
  records: EnrollmentQueueRecord[]
  total: number
  counts: { ready: number; held: number; done: number }
  years: EnrollmentYearRecord[]
}

export interface NisCandidateRow {
  applicationId: string
  fullName: string
  registrationNumber: string
  status: string
  gradeLevel: number | null
  currentNis: string | null
  studentId: string | null
}

export interface Placement {
  admissionType: 'NEW' | 'TRANSFER'
  targetGradeId: string
  targetGradeLevel: number
}

export interface PlacementState {
  status: string
  nis: string | null
  targetGradeLevel: number | null
  academicYearId: string
}

export interface ProcessState {
  status: string
  nis: string | null
  nisn: string | null
  targetGradeId: string | null
}
