import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { AdmissionPaymentWithProof } from '../../../domain/entities/admission-payment.entity.js'
import {
  IAdmissionPaymentRepository,
  type SavePaymentProofInput,
  type UpdatePaymentStatusInput,
  type VerifyWithinQuotaInput,
  type VerifyWithinQuotaResult,
} from '../../../domain/repositories/admission-payment-repository.js'
import {
  admissionToday,
  countFilledByWave,
  isWaveFull,
  MOVABLE_STATUSES,
  pickTargetWave,
  withFilledCount,
} from '../../../../wave/index.js'
import { toNumericValue } from '../../../../../shared/domain/types/decimal.type.js'

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
          bankAccountId: input.bankAccountId,
          senderAccountName: input.senderAccountName,
          transferDate: input.transferDate,
          proofFileId: fileRow.id,
          status: 'PENDING',
          note: null,
          verifiedById: null,
          verifiedAt: null,
        },
        include: { proofFile: true, bankAccount: true },
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
      include: { proofFile: true, bankAccount: true },
    })
  }

  async verifyWithinQuota(
    input: VerifyWithinQuotaInput,
  ): Promise<VerifyWithinQuotaResult> {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.admissionApplication.findFirstOrThrow({
        where: { id: input.applicationId },
        select: { id: true, waveId: true, wave: true },
      })
      const wave = application.wave
      await tx.$queryRaw`SELECT id FROM admission_waves WHERE id = ${wave.id}::uuid FOR UPDATE`

      const current = await tx.admissionPayment.findFirst({
        where: { id: input.paymentId, applicationId: input.applicationId },
        select: { status: true, proofFileId: true },
      })
      if (!current || current.status === 'UNPAID' || !current.proofFileId) {
        return { outcome: 'NO_PROOF' as const }
      }
      if (current.status === 'VERIFIED') {
        return { outcome: 'ALREADY_VERIFIED' as const }
      }

      const counts = await countFilledByWave(tx, [wave.id])
      const filledBefore = counts.get(wave.id) ?? 0
      if (isWaveFull({ quota: wave.quota, filledCount: filledBefore })) {
        return { outcome: 'FULL' as const }
      }

      const payment = await tx.admissionPayment.update({
        where: { id: input.paymentId },
        data: {
          status: 'VERIFIED',
          note: input.note,
          verifiedById: input.adminId,
          verifiedAt: new Date(),
        },
        include: { proofFile: true, bankAccount: true },
      })

      const countsAfter = await countFilledByWave(tx, [wave.id])
      const filledAfter = countsAfter.get(wave.id) ?? 0
      if (!isWaveFull({ quota: wave.quota, filledCount: filledAfter })) {
        return {
          outcome: 'VERIFIED' as const,
          payment,
          movedApplicationIds: [],
          targetWave: null,
        }
      }

      const candidates = await tx.admissionWave.findMany({
        where: {
          academicYearId: wave.academicYearId,
          isActive: true,
          deletedAt: null,
          endDate: { gte: admissionToday() },
          id: { not: wave.id },
        },
      })
      const target = pickTargetWave(wave, await withFilledCount(tx, candidates))
      if (!target) {
        return {
          outcome: 'VERIFIED' as const,
          payment,
          movedApplicationIds: [],
          targetWave: null,
        }
      }

      const movable = await tx.admissionApplication.findMany({
        where: {
          waveId: wave.id,
          deletedAt: null,
          status: { in: [...MOVABLE_STATUSES] },
          NOT: { payment: { is: { status: 'VERIFIED' } } },
        },
        select: { id: true },
      })
      const ids = movable.map((row) => row.id)
      if (ids.length > 0) {
        await tx.admissionApplication.updateMany({
          where: { id: { in: ids } },
          data: { waveId: target.id },
        })
        await tx.admissionPayment.updateMany({
          where: { applicationId: { in: ids } },
          data: { amount: target.registrationFee },
        })
      }

      return {
        outcome: 'VERIFIED' as const,
        payment,
        movedApplicationIds: ids,
        targetWave: {
          id: target.id,
          name: target.name,
          registrationFee: toNumericValue(target.registrationFee),
        },
      }
    })
  }

  async isWaveFull(waveId: string): Promise<boolean> {
    const wave = await this.prisma.admissionWave.findFirst({
      where: { id: waveId },
      select: { quota: true },
    })
    if (!wave) return false
    const counts = await countFilledByWave(this.prisma, [waveId])
    return isWaveFull({
      quota: wave.quota,
      filledCount: counts.get(waveId) ?? 0,
    })
  }
}
