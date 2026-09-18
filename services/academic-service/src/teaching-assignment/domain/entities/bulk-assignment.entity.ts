import { TeachingAssignmentWithDetails } from './teaching-assignment.entity.js'

export const SKIP_ALREADY_ASSIGNED = 'ALREADY_ASSIGNED'

export interface SkippedClassroom {
  classroomId: string
  reason: typeof SKIP_ALREADY_ASSIGNED
}

export interface BulkAssignmentResult {
  created: TeachingAssignmentWithDetails[]
  skipped: SkippedClassroom[]
}
