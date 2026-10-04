import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { HtmlSanitizerService } from '../../../shared/helpers/html-sanitizer.service.js'
import { toSlug, toUniqueSlug } from '../../../shared/helpers/slug.helper.js'
import { PostType } from '../domain/enums/post-type.enum.js'
import { SyncMediaUsageUseCase } from '../../media/use-cases/sync-media-usage.use-case.js'
import { ITagRepository } from '../../taxonomy/domain/interfaces/tag-repository.interface.js'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'
import { CreatePostDto } from '../dto/request/create-post.dto.js'
import { toAdminDetail } from '../infrastructure/mappers/post.mapper.js'

@Injectable()
export class CreatePostUseCase {
  private readonly logger = new Logger(CreatePostUseCase.name)

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly sanitizer: HtmlSanitizerService,
    private readonly tagRepository: ITagRepository,
    private readonly syncMediaUsage: SyncMediaUsageUseCase,
  ) {}

  async execute(dto: CreatePostDto, authorId: string) {
    assertTypeSpecificFields(dto)

    const slug = await this.resolveSlug(dto.type, dto.slug ?? dto.title)

    const post = await this.postRepository.create({
      type: dto.type,
      title: dto.title,
      slug,
      summary: dto.summary,
      body: this.sanitizer.sanitize(dto.body),
      coverFileId: dto.coverFileId ?? null,
      coverAltText: dto.coverAltText ?? null,
      categoryId: dto.categoryId ?? null,
      metaTitle: dto.metaTitle ?? null,
      metaDescription: dto.metaDescription ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      attachmentFileId: dto.attachmentFileId ?? null,
      authorId,
    })

    if (dto.tags?.length) {
      const tags = await this.tagRepository.resolveOrCreate(dto.tags)
      await this.tagRepository.setPostTags(
        post.id,
        tags.map((tag) => tag.id),
      )
      post.tags = tags.map((tag) => ({ tag }))
    }

    await this.syncMediaUsage.execute({
      column: 'postId',
      ownerId: post.id,
      body: post.body,
      coverFileId: post.coverFileId,
      attachmentFileId: post.attachmentFileId,
    })

    this.logger.log(`Post created as draft: ${dto.type} "${dto.title}"`)
    return toAdminDetail(post)
  }

  private async resolveSlug(type: PostType, source: string): Promise<string> {
    const base = toSlug(source)
    if (base.length === 0) {
      throw new BadRequestException(
        'The title does not produce a valid slug. Use at least one letter or digit.',
      )
    }
    const taken = await this.postRepository.findTakenSlugs(type, base)
    return toUniqueSlug(source, taken)
  }
}

export function assertTypeSpecificFields(dto: {
  type: PostType
  expiresAt?: string
  attachmentFileId?: string
}) {
  if (dto.type === PostType.PENGUMUMAN) return
  if (dto.expiresAt || dto.attachmentFileId) {
    throw new BadRequestException(
      'expiresAt and attachmentFileId apply to announcements only',
    )
  }
}
