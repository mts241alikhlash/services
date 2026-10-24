import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../core/database/prisma.service.js'
import type { ExamFile } from '../domain/entities/exam-file.entity.js'
import {
  IExamFileRepository,
  type NewExamFile,
} from '../domain/repositories/exam-file.repository.js'

@Injectable()
export class PrismaExamFileRepository extends IExamFileRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  create(input: NewExamFile): Promise<ExamFile> {
    return this.prisma.examFile.create({ data: input })
  }

  findById(id: string): Promise<ExamFile | null> {
    return this.prisma.examFile.findUnique({ where: { id } })
  }
}
