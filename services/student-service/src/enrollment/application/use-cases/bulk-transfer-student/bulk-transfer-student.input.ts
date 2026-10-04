export interface BulkTransferStudentInput {
  enrollmentIds: string[]
  targetClassroomId: string
  note?: string
}
