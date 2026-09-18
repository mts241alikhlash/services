import { EnrollmentStatus, Prisma, StudentStatus } from '@prisma/client'

export interface GraduateStudentInput {
  studentId: string
  academicYearId: string
  graduationDate?: Date
  certificateNo?: string
  note?: string
}

export async function graduateStudentSteps(
  tx: Prisma.TransactionClient,
  input: GraduateStudentInput,
): Promise<string> {
  const graduation = await tx.studentGraduation.create({
    data: {
      studentId: input.studentId,
      academicYearId: input.academicYearId,
      ...(input.graduationDate && { graduationDate: input.graduationDate }),
      ...(input.certificateNo && { certificateNo: input.certificateNo }),
      ...(input.note && { note: input.note }),
    },
    select: { id: true },
  })

  await tx.student.update({
    where: { id: input.studentId },
    data: { status: StudentStatus.GRADUATED },
  })

  await tx.studentEnrollment.updateMany({
    where: {
      studentId: input.studentId,
      status: EnrollmentStatus.ACTIVE,
      deletedAt: null,
    },
    data: {
      status: EnrollmentStatus.GRADUATED,
      endedAt: input.graduationDate ?? new Date(),
    },
  })

  return graduation.id
}
