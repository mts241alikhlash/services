export interface StudentRef {
  id: string
  userId: string
  nis: string
}

export abstract class IStudentLookupPort {
  abstract listByIds(ids: string[]): Promise<StudentRef[]>
}
