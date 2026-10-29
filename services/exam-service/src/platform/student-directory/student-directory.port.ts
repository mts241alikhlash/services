export interface StudentRef {
  id: string
  nis: string
  name: string | null
}

export abstract class IStudentDirectoryPort {
  abstract refsByIds(ids: string[]): Promise<StudentRef[]>
}
