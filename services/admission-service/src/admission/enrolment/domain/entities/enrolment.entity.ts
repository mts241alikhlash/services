export type EnrolmentTab = 'ready' | 'held' | 'done'

export interface EnrolmentQueueQuery {
  tab: EnrolmentTab
  search?: string
  waveId?: string
  page: number
  limit: number
}

export interface EnrolmentQueueRecord {
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

export interface EnrolmentYearRecord {
  academicYearId: string
  lockedAt: Date | null
}

export interface EnrolmentQueueResult {
  records: EnrolmentQueueRecord[]
  total: number
  counts: { ready: number; held: number; done: number }
  years: EnrolmentYearRecord[]
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
