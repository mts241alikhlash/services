export interface ActiveEnrollment {
  id: string
  studentId: string
  classroomId: string
  semesterId: string
}

export abstract class IEnrollmentLookupPort {
  abstract findActiveByStudent(
    studentId: string,
    semesterId?: string,
  ): Promise<ActiveEnrollment | null>
}
