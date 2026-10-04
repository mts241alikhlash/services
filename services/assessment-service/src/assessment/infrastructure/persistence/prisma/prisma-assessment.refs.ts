import { TeachingAssignmentDetail } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { EnrollmentSummary } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import {
  ProfileRosterRef,
  UserRef,
} from '../../../../shared/domain/entities/reference.entity.js'
import { AssessmentTeachingAssignmentRef } from '../../../domain/entities/assessment-item.entity.js'
import { ScoredEnrollmentRef } from '../../../domain/entities/student-score.entity.js'

export function toAssignmentRef(
  assignment: TeachingAssignmentDetail,
  userRefs: Map<string, UserRef<ProfileRosterRef>>,
): AssessmentTeachingAssignmentRef {
  return {
    id: assignment.id,
    employeeId: assignment.employeeId,
    classroomId: assignment.classroomId,
    subjectId: assignment.subjectId,
    semesterId: assignment.semesterId,
    passingScore: assignment.passingScore,
    subject: {
      id: assignment.subjectId,
      code: assignment.subjectCode,
      name: assignment.subjectName,
    },
    classroom: {
      id: assignment.classroomId,
      code: assignment.classroomCode,
      name: assignment.classroomName,
      gradeId: assignment.classroomGradeId,
      academicYearId: assignment.classroomAcademicYearId,
    },
    employee: assignment.employeeUserId
      ? {
          id: assignment.employeeId,
          userId: assignment.employeeUserId,
          user: userRefs.get(assignment.employeeUserId),
        }
      : undefined,
  }
}

export function toEnrollmentRef(
  enrolment: EnrollmentSummary,
): ScoredEnrollmentRef {
  return {
    id: enrolment.id,
    studentId: enrolment.studentId,
    classroomId: enrolment.classroomId,
    semesterId: enrolment.semesterId,
    student: {
      id: enrolment.studentId,
      userId: enrolment.studentUserId ?? '',
      user: enrolment.studentUserId
        ? {
            id: enrolment.studentUserId,
            identifier: enrolment.studentNis ?? '',
            isActive: true,
            profile: { name: enrolment.studentName ?? '' },
          }
        : undefined,
    },
  }
}
