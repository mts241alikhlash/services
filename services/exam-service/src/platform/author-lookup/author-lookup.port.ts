export abstract class IAuthorLookupPort {
  abstract namesOf(employeeIds: string[]): Promise<Map<string, string>>
}
