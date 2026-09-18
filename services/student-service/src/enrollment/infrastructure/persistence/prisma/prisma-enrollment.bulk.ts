import { EnrollmentStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'

export interface BulkEnrollmentRow {
  studentId: string
  classroomId: string
  semesterId: string
  status?: EnrollmentStatus
}

export async function createManyEnrollments(
  prisma: PrismaService,
  rows: BulkEnrollmentRow[],
): Promise<Prisma.BatchPayload> {
  return prisma.studentEnrollment.createMany({
    data: rows.map((item) => ({ ...item, status: item.status ?? undefined })),
    skipDuplicates: true,
  })
}
