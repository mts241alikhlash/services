import { ConflictException } from '@nestjs/common'
import { Prisma, StudentStatus } from '@prisma/client'
import type {
  CreateStudentRepositoryInput,
  CreateStudentWithRelationsRepositoryInput,
  EnrolExistingAccountRepositoryInput,
  EnrolExistingAccountResult,
} from '../../../domain/repositories/student.repository.js'
import { STUDENT_INCLUDE, StudentRow } from './prisma-student.includes.js'

export async function createStudentInTx(
  tx: Prisma.TransactionClient,
  userId: string,
  dto: CreateStudentRepositoryInput,
): Promise<StudentRow> {
  return tx.student.create({
    data: {
      userId,
      nis: dto.nis ?? '',
      nisn: dto.nisn ?? '',
      status: StudentStatus.ACTIVE,
      ...(dto.gradeId && { gradeId: dto.gradeId }),
    },
    include: STUDENT_INCLUDE,
  })
}

export async function createStudentWithRelationsInTx(
  tx: Prisma.TransactionClient,
  userId: string,
  dto: CreateStudentWithRelationsRepositoryInput,
): Promise<StudentRow> {
  const student = await tx.student.create({
    data: {
      userId,
      nis: dto.nis ?? '',
      nisn: dto.nisn ?? '',
      status: StudentStatus.ACTIVE,
      ...(dto.gradeId && { gradeId: dto.gradeId }),
    },
  })

  for (const parentInput of dto.parents ?? []) {
    const parent = await tx.parent.create({
      data: {
        name: parentInput.name,
        nik: parentInput.nik,
        birthPlace: parentInput.birthPlace,
        birthDate: new Date(parentInput.birthDate),
        email: parentInput.email,
        phone: parentInput.phone,
        occupationId: parentInput.occupationId,
        income: parentInput.income,
      },
    })
    await tx.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parent.id,
        relation: parentInput.relation,
        isPrimary: parentInput.isPrimary ?? false,
      },
    })
  }

  return tx.student.findUniqueOrThrow({
    where: { id: student.id },
    include: STUDENT_INCLUDE,
  })
}

export async function enrolExistingAccountInTx(
  tx: Prisma.TransactionClient,
  input: EnrolExistingAccountRepositoryInput,
  activeSemesterId: string | null,
): Promise<EnrolExistingAccountResult> {
  const existing = await tx.student.findUnique({
    where: { userId: input.userId },
    select: { id: true },
  })
  if (existing) {
    return {
      studentId: existing.id,
      parentsLinked: 0,
      enrollmentCreated: false,
      alreadyEnrolled: true,
    }
  }

  const student = await tx.student.create({
    data: {
      userId: input.userId,
      nis: input.nis,
      nisn: input.nisn,
      status: StudentStatus.ACTIVE,
      ...(input.gradeId && { gradeId: input.gradeId }),
    },
  })

  let parentsLinked = 0
  for (const parentInput of input.parents ?? []) {
    let parent = await tx.parent.findUnique({ where: { nik: parentInput.nik } })
    parent ??= await tx.parent.create({
      data: {
        name: parentInput.name,
        nik: parentInput.nik,
        birthPlace: parentInput.birthPlace,
        birthDate: new Date(parentInput.birthDate),
        email: parentInput.email,
        phone: parentInput.phone,
        occupationId: parentInput.occupationId,
        income: parentInput.income,
      },
    })
    await tx.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parent.id,
        relation: parentInput.relation,
        isPrimary: parentInput.isPrimary ?? false,
      },
    })
    parentsLinked += 1
  }

  let enrollmentCreated = false
  if (input.classroomId) {
    if (!activeSemesterId) {
      throw new ConflictException(
        'No active semester is available for classroom enrolment',
      )
    }
    await tx.studentEnrollment.create({
      data: {
        studentId: student.id,
        classroomId: input.classroomId,
        semesterId: activeSemesterId,
        status: 'ACTIVE',
      },
    })
    enrollmentCreated = true
  }

  return {
    studentId: student.id,
    parentsLinked,
    enrollmentCreated,
    alreadyEnrolled: false,
  }
}
