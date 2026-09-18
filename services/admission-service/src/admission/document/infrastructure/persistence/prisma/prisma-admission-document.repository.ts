import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  AdmissionDocumentTypeRef,
  AdmissionDocumentWithType,
  AdmissionDocumentWithTypeAndFile,
} from '../../../domain/entities/admission-document.entity.js'
import {
  IAdmissionDocumentRepository,
  type AdmissionDocumentApplicationRef,
  type SaveAdmissionDocumentInput,
  type UpdateAdmissionDocumentStatusInput,
} from '../../../domain/repositories/admission-document-repository.js'

@Injectable()
export class PrismaAdmissionDocumentRepository extends IAdmissionDocumentRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findApplicationForUpload(
    userId: string,
  ): Promise<AdmissionDocumentApplicationRef | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, status: true },
    })
  }

  async findByApplicationId(
    applicationId: string,
  ): Promise<AdmissionDocumentApplicationRef | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      select: { id: true, status: true },
    })
  }

  async findDocumentTypeByCode(
    code: string,
  ): Promise<AdmissionDocumentTypeRef | null> {
    return this.prisma.admissionDocumentType.findFirst({ where: { code } })
  }

  async findActiveDocumentTypes(): Promise<AdmissionDocumentTypeRef[]> {
    return this.prisma.admissionDocumentType.findMany({
      where: { isActive: true },
    })
  }

  async findRequiredActiveDocumentTypes(): Promise<AdmissionDocumentTypeRef[]> {
    return this.prisma.admissionDocumentType.findMany({
      where: { isActive: true, isRequired: true },
    })
  }

  async saveDocument(
    input: SaveAdmissionDocumentInput,
  ): Promise<AdmissionDocumentWithTypeAndFile> {
    return this.prisma.$transaction(async (tx) => {
      const fileRow = await tx.file.create({ data: input.file })
      return tx.admissionDocument.upsert({
        where: {
          applicationId_documentTypeId: {
            applicationId: input.applicationId,
            documentTypeId: input.documentTypeId,
          },
        },
        update: {
          fileId: fileRow.id,
          status: 'PENDING',
          note: null,
          verifiedById: null,
          verifiedAt: null,
        },
        create: {
          applicationId: input.applicationId,
          documentTypeId: input.documentTypeId,
          fileId: fileRow.id,
          status: 'PENDING',
        },
        include: { documentType: true, file: true },
      })
    })
  }

  async findDocument(
    applicationId: string,
    documentId: string,
  ): Promise<AdmissionDocumentWithType | null> {
    return this.prisma.admissionDocument.findFirst({
      where: { id: documentId, applicationId },
      include: { documentType: true },
    })
  }

  async updateDocumentStatus(
    documentId: string,
    input: UpdateAdmissionDocumentStatusInput,
  ): Promise<AdmissionDocumentWithTypeAndFile> {
    return this.prisma.admissionDocument.update({
      where: { id: documentId },
      data: {
        status: input.status,
        note: input.note,
        verifiedById: input.adminId,
        verifiedAt: new Date(),
      },
      include: { documentType: true, file: true },
    })
  }
}
