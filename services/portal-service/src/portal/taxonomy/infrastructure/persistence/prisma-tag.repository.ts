import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { toSlug } from '../../../../shared/helpers/slug.helper.js'
import {
  CreateTagInput,
  ITagRepository,
  PostTagEntity,
} from '../../domain/interfaces/tag-repository.interface.js'

const TAG_FIELDS = { id: true, name: true, slug: true } as const

@Injectable()
export class PrismaTagRepository extends ITagRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(search?: string): Promise<PostTagEntity[]> {
    return this.prisma.postTag.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      select: TAG_FIELDS,
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string): Promise<PostTagEntity | null> {
    return this.prisma.postTag.findUnique({
      where: { id },
      select: TAG_FIELDS,
    })
  }

  async findBySlug(slug: string): Promise<PostTagEntity | null> {
    return this.prisma.postTag.findUnique({
      where: { slug },
      select: TAG_FIELDS,
    })
  }

  async create(data: CreateTagInput): Promise<PostTagEntity> {
    return this.prisma.postTag.create({ data, select: TAG_FIELDS })
  }

  async rename(id: string, name: string): Promise<PostTagEntity> {
    return this.prisma.postTag.update({
      where: { id },
      data: { name },
      select: TAG_FIELDS,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.postTag.delete({ where: { id } })
  }

  async resolveOrCreate(names: string[]): Promise<PostTagEntity[]> {
    const unique = new Map<string, string>()
    for (const name of names) {
      const trimmed = name.trim()
      const slug = toSlug(trimmed)
      if (slug.length > 0 && !unique.has(slug)) unique.set(slug, trimmed)
    }

    return Promise.all(
      [...unique].map(([slug, name]) =>
        this.prisma.postTag.upsert({
          where: { slug },
          update: {},
          create: { name, slug },
          select: TAG_FIELDS,
        }),
      ),
    )
  }

  async setPostTags(postId: string, tagIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.postTagOnPost.deleteMany({ where: { postId } }),
      this.prisma.postTagOnPost.createMany({
        data: tagIds.map((tagId) => ({ postId, tagId })),
        skipDuplicates: true,
      }),
    ])
  }

  async findByPostId(postId: string): Promise<PostTagEntity[]> {
    const rows = await this.prisma.postTagOnPost.findMany({
      where: { postId },
      select: { tag: { select: TAG_FIELDS } },
      orderBy: { tag: { name: 'asc' } },
    })
    return rows.map((row) => row.tag)
  }
}
