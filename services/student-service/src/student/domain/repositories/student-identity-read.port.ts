export interface StudentRefRow {
  id: string
  userId: string
  nis: string
}

export abstract class IStudentIdentityReadPort {
  abstract findStudentIdByUserId(userId: string): Promise<string | null>
  abstract listRefsByIds(ids: string[]): Promise<StudentRefRow[]>
}
