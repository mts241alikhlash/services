import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  IAdmissionFileRepository,
  type ServableFile,
} from '../../../domain/repositories/admission-file.repository.js'

@Injectable()
export class PrismaAdmissionFileRepository extends IAdmissionFileRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  findServable(fileId: string): Promise<ServableFile | null> {
    return this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
        OR: [
          { admissionDocuments: { some: {} } },
          { admissionPaymentProofs: { some: {} } },
          { admissionAchievements: { some: {} } },
          { admissionScholarships: { some: {} } },
          { applicationId: { not: null } },
        ],
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        storageKey: true,
      },
    })
  }
}
