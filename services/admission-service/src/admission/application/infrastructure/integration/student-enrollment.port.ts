export interface EnrollStudentInput {
  applicationId?: string
  userId: string
  nis: string
  nisn: string
  gradeId?: string
  classroomId?: string
  profile: {
    name: string
    nik: string
    gender: string
    birthPlace: string
    birthDate: string
    email?: string | null
    phone?: string | null
    religionId?: string | null
  }
  parents?: {
    name: string
    nik: string
    birthPlace: string
    birthDate: string
    email?: string | null
    phone?: string | null
    occupationId: string
    income?: string | null
    relation: string
    isPrimary?: boolean
  }[]
  address?: {
    street: string
    rt: string
    rw: string
    village: string
    district: string
    city: string
    province: string
    country?: string
    postalCode: string
  }
}

export interface EnrollStudentResult {
  studentId: string
  parentsLinked: number
  enrollmentCreated: boolean
  alreadyEnrolled: boolean
}

export abstract class IStudentEnrollmentPort {
  abstract enroll(
    input: EnrollStudentInput,
    bearerToken: string,
  ): Promise<EnrollStudentResult>

  abstract updateNis(
    studentId: string,
    nis: string,
    bearerToken: string,
  ): Promise<void>
}
