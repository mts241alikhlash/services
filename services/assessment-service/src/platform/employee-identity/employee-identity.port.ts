export abstract class IEmployeeIdentityReadPort {
  abstract findEmployeeIdByUserId(userId: string): Promise<string | null>

  abstract employeeExists(id: string): Promise<boolean>
}
