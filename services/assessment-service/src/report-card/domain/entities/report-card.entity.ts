export interface ReportCardEntity {
  id: string
  studentEnrollmentId?: string
  enrollmentId?: string
  academicSummary?: string | null
  extracurricularNotes?: string | null
  employeeNotes?: string | null
  employeeNote?: string | null
  totalAverage?: number | null
  rank?: number | null
  isPublished?: boolean
  publishedAt?: Date | null
  deletedAt?: Date | null
}

export interface ReportCardSubjectEntity {
  subjectId: string
  subjectCode?: string | null
  subjectName: string
  score: number
  passingScore: number
  predicate: string
  description: string
  isComplete: boolean
}

export interface ReportCardWithDetails extends ReportCardEntity {
  subjects?: ReportCardSubjectEntity[]
  enrollment?: {
    id: string
    student?: {
      nis?: string | null
      user?: {
        profile?: {
          name?: string | null
        } | null
      } | null
    } | null
    classroom?: {
      name?: string | null
      code?: string | null
    } | null
    semester?: {
      type?: {
        name?: string | null
      } | null
      academicYear?: {
        name?: string | null
      } | null
    } | null
  } | null
  scores?: { id: string; assessmentItemId: string; score: number | null }[]
}
