import { ConflictException } from '@nestjs/common'
import {
  AdmissionApplication,
  Prisma,
} from '../../../../../generated/prisma/client.js'
import { countFilledByWave, isWaveFull } from '../../../../wave/index.js'
import {
  DecimalValue,
  toNumericValue,
} from '../../../../../shared/domain/types/decimal.type.js'

export async function createDraftApplication(
  tx: Prisma.TransactionClient,
  input: {
    waveId: string
    waveCode: string
    registrationFee: DecimalValue
    userId: string
    fullName: string
    identifier: string
    phone?: string | null
    admissionType?: 'NEW' | 'TRANSFER'
    targetGradeId?: string
    targetGradeLevel?: number
  },
): Promise<AdmissionApplication> {
  const updatedWave = await tx.admissionWave.update({
    where: { id: input.waveId },
    data: { lastRegistrationSeq: { increment: 1 } },
  })
  const filled = await countFilledByWave(tx, [input.waveId])
  if (
    isWaveFull({
      quota: updatedWave.quota,
      filledCount: filled.get(input.waveId) ?? 0,
    })
  ) {
    throw new ConflictException('Gelombang penuh')
  }
  const registrationNumber = `${input.waveCode}-${String(
    updatedWave.lastRegistrationSeq,
  ).padStart(4, '0')}`

  const app = await tx.admissionApplication.create({
    data: {
      userId: input.userId,
      waveId: input.waveId,
      registrationNumber,
      status: 'DRAFT',
      fullName: input.fullName,
      email: input.identifier,
      phone: input.phone,
      admissionType: input.admissionType,
      targetGradeId: input.targetGradeId,
      targetGradeLevel: input.targetGradeLevel,
    },
  })

  await tx.admissionPayment.create({
    data: {
      applicationId: app.id,
      amount: toNumericValue(input.registrationFee),
      status: 'UNPAID',
    },
  })

  await tx.admissionNotification.create({
    data: {
      applicationId: app.id,
      type: 'GENERAL',
      title: 'Akun pendaftaran berhasil dibuat',
      message: `Nomor pendaftaran Anda ${registrationNumber}. Langkah berikutnya: lengkapi formulir, unggah berkas persyaratan, dan selesaikan pembayaran biaya pendaftaran.`,
    },
  })

  return app
}
