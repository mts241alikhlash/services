import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'

export async function findActiveGradeLevels(
  academicLookup: IAcademicLookupPort,
): Promise<number[]> {
  return academicLookup.listGradeLevels()
}

export async function findActiveClassroomCodes(
  academicLookup: IAcademicLookupPort,
): Promise<string[]> {
  return academicLookup.listClassroomCodes()
}
