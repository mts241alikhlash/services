import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  IStudentIdentityReadPort,
  StudentRefRow,
} from '../../../domain/repositories/student-identity-read.port.js'

@Injectable()
export class PrismaStudentIdentityReadPort extends IStudentIdentityReadPort {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findStudentIdByUserId(userId: string): Promise<string | null> {
    const student = await this.prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    })
    return student?.id ?? null
  }

  async listRefsByIds(ids: string[]): Promise<StudentRefRow[]> {
    if (ids.length === 0) return []
    return this.prisma.student.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, userId: true, nis: true },
    })
  }
}
