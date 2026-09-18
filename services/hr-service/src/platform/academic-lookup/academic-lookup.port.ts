export abstract class IAcademicLookupPort {
  abstract listEmployeeIdsForAcademicYear(
    academicYearId: string,
  ): Promise<string[]>
}
