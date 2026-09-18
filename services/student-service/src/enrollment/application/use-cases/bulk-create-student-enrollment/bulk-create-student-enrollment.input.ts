import type { CreateStudentEnrollmentInput } from '../create-student-enrollment/create-student-enrollment.input.js'

export interface BulkCreateStudentEnrollmentInput {
  enrollments: CreateStudentEnrollmentInput[]
}
