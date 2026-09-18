import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { AdmissionPaymentWithProof } from '../../../domain/entities/admission-payment.entity.js'
import {
  IAdmissionPaymentRepository,
  type SavePaymentProofInput,
  type UpdatePaymentStatusInput,
} from '../../../domain/repositories/admission-payment-repository.js'

@Injectable()
export class PrismaAdmissionPaymentRepository extends IAdmissionPaymentRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findApplicationWithPayment(userId: string) {
    return this.prisma.admissionApplication.findFirst({
      where: { userId, deletedAt: null },
      include: { payment: true },
    })
  }

  async findByApplicationId(applicationId: string) {
    return this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      include: { payment: true },
    })
  }

  async savePaymentProof(
    input: SavePaymentProofInput,
  ): Promise<AdmissionPaymentWithProof> {
    return this.prisma.$transaction(async (tx) => {
      const fileRow = await tx.file.create({ data: input.file })

      return tx.admissionPayment.update({
        where: { id: input.paymentId },
        data: {
          bankName: input.bankName,
          senderAccountName: input.senderAccountName,
          transferDate: input.transferDate,
          proofFileId: fileRow.id,
          status: 'PENDING',
          note: null,
          verifiedById: null,
          verifiedAt: null,
        },
        include: { proofFile: true },
      })
    })
  }

  async findPayment(
    applicationId: string,
  ): Promise<AdmissionPaymentWithProof | null> {
    return this.prisma.admissionPayment.findFirst({
      where: { applicationId },
    })
  }

  async updatePaymentStatus(
    paymentId: string,
    input: UpdatePaymentStatusInput,
  ): Promise<AdmissionPaymentWithProof> {
    return this.prisma.admissionPayment.update({
      where: { id: paymentId },
      data: {
        status: input.status,
        note: input.note,
        verifiedById: input.adminId,
        verifiedAt: new Date(),
      },
      include: { proofFile: true },
    })
  }
}
