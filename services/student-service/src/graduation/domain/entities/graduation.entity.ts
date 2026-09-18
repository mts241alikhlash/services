import { PersonRef } from '../../../shared/domain/entities/index.js'

export interface StudentGraduationEntity {
  id: string
  studentId: string
  academicYearId: string
  graduationDate?: Date | null
  certificateNumber?: string | null
  certificateNo?: string | null
  notes?: string | null
  deletedAt?: Date | null
}

export interface StudentGraduationWithDetails extends StudentGraduationEntity {
  student?: PersonRef
  academicYear?: { id: string; name: string } | null
  certificateNo?: string | null
}

export type GraduationWithDetails = StudentGraduationWithDetails
