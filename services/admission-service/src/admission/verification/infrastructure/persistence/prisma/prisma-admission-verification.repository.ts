import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  IAdmissionVerificationRepository,
  type VerificationSnapshot,
} from '../../../domain/repositories/admission-verification.repository.js'

@Injectable()
export class PrismaAdmissionVerificationRepository extends IAdmissionVerificationRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findRequiredTypeIds(): Promise<string[]> {
    const types = await this.prisma.admissionDocumentType.findMany({
      where: { isActive: true, isRequired: true },
      select: { id: true },
    })
    return types.map((type) => type.id)
  }

  async findSnapshot(
    applicationId: string,
  ): Promise<VerificationSnapshot | null> {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      select: {
        status: true,
        documents: { select: { documentTypeId: true, status: true } },
        payment: { select: { status: true } },
      },
    })
    if (!application) return null
    return {
      status: application.status,
      documents: application.documents,
      paymentStatus: application.payment?.status ?? null,
    }
  }

  async markVerified(
    applicationId: string,
    verifiedById: string | null,
    requiredTypeIds: string[],
  ): Promise<boolean> {
    const { count } = await this.prisma.admissionApplication.updateMany({
      where: {
        id: applicationId,
        deletedAt: null,
        status: 'SUBMITTED',
        payment: { is: { status: 'VERIFIED' } },
        AND: requiredTypeIds.map((documentTypeId) => ({
          documents: { some: { documentTypeId, status: 'APPROVED' } },
        })),
      },
      data: {
        status: 'VERIFIED',
        verifiedById,
        verifiedAt: new Date(),
      },
    })
    return count === 1
  }
}
