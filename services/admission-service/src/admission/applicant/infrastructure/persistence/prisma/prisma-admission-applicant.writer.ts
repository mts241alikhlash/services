import { Injectable } from '@nestjs/common'
import { AdmissionApplication, AdmissionNotification } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  applicationDetailInclude,
  ApplicationDetail,
} from '../../../../application/infrastructure/persistence/prisma/prisma-admission-application.includes.js'
import {
  type CreateAdmissionNotificationInput,
  type EnsureApplicationInput,
  type UpdateMyApplicationFields,
  type UpdateMyApplicationInput,
} from '../../../domain/repositories/admission-applicant-repository.js'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import {
  attachParentReferences,
  attachWaveAcademicYear,
} from '../../../../application/infrastructure/persistence/prisma/prisma-admission.refs.js'
import { createDraftApplication } from './prisma-admission-applicant.draft.js'

@Injectable()
export class PrismaAdmissionApplicantWriter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceLookup: IReferenceLookupPort,
  ) {}

  async update(
    id: string,
    input: UpdateMyApplicationFields,
  ): Promise<AdmissionApplication> {
    return this.prisma.admissionApplication.update({
      where: { id },
      data: input,
    })
  }

  async remove(id: string): Promise<AdmissionApplication> {
    return this.prisma.admissionApplication.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async updateMyApplication(
    input: UpdateMyApplicationInput,
  ): Promise<ApplicationDetail> {
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.admissionApplication.update({
        where: { id: input.applicationId },
        data: input.data,
      })

      if (input.parents !== undefined) {
        await tx.admissionApplicationParent.deleteMany({
          where: { applicationId: input.applicationId },
        })
        for (const p of input.parents) {
          await tx.admissionApplicationParent.create({
            data: { applicationId: input.applicationId, ...p },
          })
        }
      }

      return tx.admissionApplication.findUniqueOrThrow({
        where: { id: input.applicationId },
        include: applicationDetailInclude,
      })
    })

    return attachWaveAcademicYear(
      await attachParentReferences(updated, this.referenceLookup),
      this.referenceLookup,
    )
  }

  async submitApplication(applicationId: string): Promise<ApplicationDetail> {
    const application = await this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      include: applicationDetailInclude,
    })
    return attachWaveAcademicYear(
      await attachParentReferences(application, this.referenceLookup),
      this.referenceLookup,
    )
  }

  async ensureApplication(
    input: EnsureApplicationInput,
  ): Promise<ApplicationDetail> {
    const existing = await this.prisma.admissionApplication.findFirst({
      where: { userId: input.userId, deletedAt: null },
      include: applicationDetailInclude,
    })
    if (existing) {
      return attachWaveAcademicYear(
        await attachParentReferences(existing, this.referenceLookup),
        this.referenceLookup,
      )
    }

    const created = await this.prisma.$transaction((tx) =>
      createDraftApplication(tx, {
        waveId: input.waveId,
        waveCode: input.waveCode,
        registrationFee: input.registrationFee,
        userId: input.userId,
        fullName: '',
        identifier: '',
        phone: null,
      }),
    )

    const detail = await this.prisma.admissionApplication.findUniqueOrThrow({
      where: { id: created.id },
      include: applicationDetailInclude,
    })
    return attachWaveAcademicYear(
      await attachParentReferences(detail, this.referenceLookup),
      this.referenceLookup,
    )
  }

  async createNotification(
    input: CreateAdmissionNotificationInput,
  ): Promise<AdmissionNotification> {
    return this.prisma.admissionNotification.create({ data: input })
  }
}
