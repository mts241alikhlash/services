import { Injectable } from '@nestjs/common'
import {
  AdmissionApplication,
  AdmissionNotification,
  AdmissionDocumentType,
  AdmissionWave,
} from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import { IAccountProvisioningPort } from '../../../../../platform/user/index.js'
import { ApplicationDetail } from '../../../../application/infrastructure/persistence/prisma/prisma-admission-application.includes.js'
import type { AdmissionAnnouncementWithWave } from '../../../../announcement/index.js'
import {
  ActiveWaveRow,
  IAdmissionApplicantRepository,
  RegisterApplicantInput,
  type CreateAdmissionNotificationInput,
  type EnsureApplicationInput,
  type UpdateMyApplicationFields,
  type UpdateMyApplicationInput,
} from '../../../domain/repositories/admission-applicant-repository.js'
import { PrismaAdmissionApplicantReader } from './prisma-admission-applicant.reader.js'
import { PrismaAdmissionApplicantWriter } from './prisma-admission-applicant.writer.js'
import { createDraftApplication } from './prisma-admission-applicant.draft.js'

@Injectable()
export class PrismaAdmissionApplicantRepository extends IAdmissionApplicantRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountProvisioning: IAccountProvisioningPort,
    private readonly reader: PrismaAdmissionApplicantReader,
    private readonly writer: PrismaAdmissionApplicantWriter,
  ) {
    super()
  }

  async findAll(): Promise<ActiveWaveRow[]> {
    return this.reader.findAll()
  }

  async findById(id: string): Promise<AdmissionApplication | null> {
    return this.reader.findById(id)
  }

  async findByUserId(userId: string): Promise<AdmissionApplication | null> {
    return this.reader.findByUserId(userId)
  }

  async findByRegistrationNumber(
    regNum: string,
  ): Promise<AdmissionApplication | null> {
    return this.reader.findByRegistrationNumber(regNum)
  }

  async create(applicationId: string): Promise<ApplicationDetail> {
    return this.writer.submitApplication(applicationId)
  }

  async update(
    id: string,
    input: UpdateMyApplicationFields,
  ): Promise<AdmissionApplication> {
    return this.writer.update(id, input)
  }

  async remove(id: string): Promise<AdmissionApplication> {
    return this.writer.remove(id)
  }

  async findOpenWave(waveId: string): Promise<AdmissionWave | null> {
    return this.reader.findOpenWave(waveId)
  }

  async findActiveWave(): Promise<AdmissionWave | null> {
    return this.reader.findActiveWave()
  }

  async ensureApplication(
    input: EnsureApplicationInput,
  ): Promise<ApplicationDetail> {
    return this.writer.ensureApplication(input)
  }

  async isIdentifierTaken(identifier: string): Promise<boolean> {
    const { identifierTaken } =
      await this.accountProvisioning.lookup(identifier)
    return identifierTaken
  }

  async registerApplicant(
    input: RegisterApplicantInput,
  ): Promise<AdmissionApplication> {
    const user = await this.accountProvisioning.provision({
      identifier: input.identifier,
      passwordHash: input.passwordHash,
      roleCode: 'APPLICANT',
    })

    try {
      return await this.prisma.$transaction((tx) =>
        createDraftApplication(tx, {
          waveId: input.wave.id,
          waveCode: input.wave.code,
          registrationFee: input.wave.registrationFee,
          userId: user.id,
          fullName: input.fullName,
          identifier: input.identifier,
          phone: input.phone,
        }),
      )
    } catch (error) {
      await this.accountProvisioning.deprovision(user.id)
      throw error
    }
  }

  async findActiveWaves(): Promise<ActiveWaveRow[]> {
    return this.reader.findActiveWaves()
  }

  async findActiveDocumentTypes(): Promise<AdmissionDocumentType[]> {
    return this.reader.findActiveDocumentTypes()
  }

  async findPublishedAnnouncementsForUser(
    userId: string,
  ): Promise<AdmissionAnnouncementWithWave[]> {
    return this.reader.findPublishedAnnouncementsForUser(userId)
  }

  async findMyApplication(
    userId: string,
  ): Promise<AdmissionApplication | null> {
    return this.reader.findMyApplication(userId)
  }

  async findMyDetail(userId: string): Promise<ApplicationDetail | null> {
    return this.reader.findMyDetail(userId)
  }

  async findDetailById(
    applicationId: string,
  ): Promise<ApplicationDetail | null> {
    return this.reader.findDetailById(applicationId)
  }

  async findRequiredActiveDocumentTypes(): Promise<AdmissionDocumentType[]> {
    return this.reader.findRequiredActiveDocumentTypes()
  }

  async updateMyApplication(
    input: UpdateMyApplicationInput,
  ): Promise<ApplicationDetail> {
    return this.writer.updateMyApplication(input)
  }

  async submitApplication(applicationId: string): Promise<ApplicationDetail> {
    return this.writer.submitApplication(applicationId)
  }

  async createNotification(
    input: CreateAdmissionNotificationInput,
  ): Promise<AdmissionNotification> {
    return this.writer.createNotification(input)
  }
}
