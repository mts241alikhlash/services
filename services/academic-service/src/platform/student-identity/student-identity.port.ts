export abstract class IStudentIdentityReadPort {
  abstract findStudentIdByUserId(userId: string): Promise<string | null>
}
