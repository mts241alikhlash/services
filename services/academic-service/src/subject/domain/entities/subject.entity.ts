export interface SubjectEntity {
  id: string
  code?: string | null
  name: string
  description?: string | null
  isActive?: boolean
  deletedAt?: Date | null
}

export interface SubjectTeachingAssignment {
  id: string
  employeeId: string
  classroom: { id: string; name: string | null }
  employee: {
    nip: string | null
    user: { profile: { name: string } } | null
  }
}

export interface SubjectWithEmployees extends SubjectEntity {
  _count?: {
    teachingAssignments?: number
  }
  teachingAssignments?: SubjectTeachingAssignment[]
}
