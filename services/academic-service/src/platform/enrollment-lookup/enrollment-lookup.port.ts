export abstract class IEnrollmentLookupPort {
  abstract findActiveClassroomId(studentId: string): Promise<string | null>
  abstract countByClassroom(classroomId: string): Promise<number>
  abstract countBySemester(semesterId: string): Promise<number>
  abstract countBySemesters(semesterIds: string[]): Promise<Map<string, number>>
  abstract rolloverToSemester(
    sourceSemesterId: string,
    targetSemesterId: string,
    classroomIdMap: Map<string, string>,
  ): Promise<{ created: number; skipped: number }>
}
