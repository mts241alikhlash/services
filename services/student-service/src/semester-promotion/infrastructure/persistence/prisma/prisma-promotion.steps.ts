import { EnrollmentStatus, Prisma } from '@prisma/client'
import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'
import {
  PromotionResult,
  StudentPromotionInput,
} from '../../../domain/repositories/promotion.repository.js'

interface ActiveEnrollment {
  id: string
  studentId: string
}

export async function moveStudentToTargetSemester(
  tx: Prisma.TransactionClient,
  enrollment: ActiveEnrollment,
  student: StudentPromotionInput,
  targetSemesterId: string,
  gradeIdByClassroom: Map<string, string>,
  result: PromotionResult,
): Promise<void> {
  const existingEnrollment = await tx.studentEnrollment.findFirst({
    where: {
      studentId: enrollment.studentId,
      semesterId: targetSemesterId,
      deletedAt: null,
    },
  })

  if (existingEnrollment) {
    result.skipped++
    return
  }

  const isPromote = student.action === PromotionAction.PROMOTE

  await tx.studentEnrollment.update({
    where: { id: enrollment.id },
    data: {
      status: isPromote ? EnrollmentStatus.PROMOTED : EnrollmentStatus.REPEATED,
      endedAt: new Date(),
      note: student.declineReason ?? null,
    },
  })

  await tx.studentEnrollment.create({
    data: {
      studentId: enrollment.studentId,
      classroomId: student.targetClassroomId!,
      semesterId: targetSemesterId,
      status: EnrollmentStatus.ACTIVE,
    },
  })

  const gradeId = gradeIdByClassroom.get(student.targetClassroomId!)
  if (gradeId) {
    await tx.student.update({
      where: { id: enrollment.studentId },
      data: { gradeId },
    })
  }

  if (isPromote) {
    result.promoted++
  } else {
    result.repeated++
  }
}
