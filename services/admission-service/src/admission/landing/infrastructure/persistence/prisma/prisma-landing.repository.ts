import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../../generated/prisma/client.js'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  LandingImageEntity,
  LandingSectionRecord,
} from '../../../domain/entities/landing.entity.js'
import {
  ILandingRepository,
  type CreateLandingImageRecord,
} from '../../../domain/repositories/landing-repository.js'

@Injectable()
export class PrismaLandingRepository extends ILandingRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  findAllSections(): Promise<LandingSectionRecord[]> {
    return this.prisma.admissionLandingSection.findMany()
  }

  async saveDraft(
    key: string,
    document: unknown,
    userId: string,
  ): Promise<void> {
    const draft = document as Prisma.InputJsonValue
    await this.prisma.admissionLandingSection.upsert({
      where: { key },
      create: {
        key,
        draft,
        draftUpdatedAt: new Date(),
        draftUpdatedById: userId,
      },
      update: {
        draft,
        draftUpdatedAt: new Date(),
        draftUpdatedById: userId,
      },
    })
  }

  publishAll(userId: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.admissionLandingSection.findMany({
        where: { NOT: { draft: { equals: Prisma.DbNull } } },
      })
      const publishedAt = new Date()
      for (const row of rows) {
        await tx.admissionLandingSection.update({
          where: { key: row.key },
          data: {
            published: row.draft as Prisma.InputJsonValue,
            draft: Prisma.DbNull,
            publishedAt,
            publishedById: userId,
          },
        })
      }
      return rows.length
    })
  }

  async discardAll(): Promise<void> {
    await this.prisma.admissionLandingSection.updateMany({
      data: {
        draft: Prisma.DbNull,
        draftUpdatedAt: null,
        draftUpdatedById: null,
      },
    })
  }

  findImage(id: string): Promise<LandingImageEntity | null> {
    return this.prisma.admissionLandingImage.findUnique({ where: { id } })
  }

  findImagesByIds(ids: string[]): Promise<LandingImageEntity[]> {
    return this.prisma.admissionLandingImage.findMany({
      where: { id: { in: ids } },
    })
  }

  findAllImages(): Promise<LandingImageEntity[]> {
    return this.prisma.admissionLandingImage.findMany()
  }

  createImage(input: CreateLandingImageRecord): Promise<LandingImageEntity> {
    return this.prisma.admissionLandingImage.create({ data: input })
  }

  async deleteImages(ids: string[]): Promise<LandingImageEntity[]> {
    const rows = await this.prisma.admissionLandingImage.findMany({
      where: { id: { in: ids } },
    })
    await this.prisma.admissionLandingImage.deleteMany({
      where: { id: { in: ids } },
    })
    return rows
  }
}
