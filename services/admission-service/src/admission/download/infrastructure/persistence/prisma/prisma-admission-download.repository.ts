import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { AdmissionDownloadEntity } from '../../../domain/entities/admission-download.entity.js'
import {
  IAdmissionDownloadRepository,
  type CreateDownloadRecord,
  type UpdateDownloadRecord,
} from '../../../domain/repositories/admission-download-repository.js'

const ORDER = [{ sortOrder: 'asc' as const }, { title: 'asc' as const }]

@Injectable()
export class PrismaAdmissionDownloadRepository extends IAdmissionDownloadRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  findAll(): Promise<AdmissionDownloadEntity[]> {
    return this.prisma.admissionDownload.findMany({ orderBy: ORDER })
  }

  findActive(): Promise<AdmissionDownloadEntity[]> {
    return this.prisma.admissionDownload.findMany({
      where: { isActive: true },
      orderBy: ORDER,
    })
  }

  findById(id: string): Promise<AdmissionDownloadEntity | null> {
    return this.prisma.admissionDownload.findUnique({ where: { id } })
  }

  async titleTaken(title: string, exceptId?: string): Promise<boolean> {
    const row = await this.prisma.admissionDownload.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        ...(exceptId && { NOT: { id: exceptId } }),
      },
      select: { id: true },
    })
    return row !== null
  }

  async maxSortOrder(): Promise<number> {
    const result = await this.prisma.admissionDownload.aggregate({
      _max: { sortOrder: true },
    })
    return result._max.sortOrder ?? 0
  }

  create(input: CreateDownloadRecord): Promise<AdmissionDownloadEntity> {
    return this.prisma.admissionDownload.create({ data: input })
  }

  update(
    id: string,
    input: UpdateDownloadRecord,
  ): Promise<AdmissionDownloadEntity> {
    return this.prisma.admissionDownload.update({
      where: { id },
      data: input,
    })
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.admissionDownload.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    )
  }

  async delete(id: string): Promise<void> {
    await this.prisma.admissionDownload.delete({ where: { id } })
  }
}
