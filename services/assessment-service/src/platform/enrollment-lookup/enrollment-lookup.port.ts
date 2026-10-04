export interface EnrollmentSummary {
  id: string
  studentId: string
  classroomId: string
  semesterId: string
  status: string | null
  studentUserId: string | null
  studentNis: string | null
  studentName: string | null
}

export interface EnrollmentSearch {
  studentId?: string
  classroomId?: string
  semesterId?: string
  limit?: number
}

export interface ClassroomEnrollmentCount {
  classroomId: string
  count: number
}

export abstract class IEnrollmentLookupPort {
  abstract findSummary(id: string): Promise<EnrollmentSummary | null>
  abstract findActiveByStudent(
    studentId: string,
    semesterId?: string,
  ): Promise<EnrollmentSummary | null>
  abstract search(query: EnrollmentSearch): Promise<EnrollmentSummary[]>
  abstract countByClassrooms(
    classroomIds: string[],
    semesterId: string,
  ): Promise<ClassroomEnrollmentCount[]>
  abstract listByClassroom(
    classroomId: string,
    semesterId?: string,
    limit?: number,
  ): Promise<EnrollmentSummary[]>
  abstract countActive(ids: string[]): Promise<number>
  abstract listByIds(ids: string[]): Promise<EnrollmentSummary[]>
}
