import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { HtmlSanitizerService } from '../../../shared/helpers/html-sanitizer.service.js'
import { PUBLISHED_STATUS } from '../constants/post.constants.js'
import { PostType } from '../domain/enums/post-type.enum.js'
import {
  IPostRepository,
  UpdatePostInput,
} from '../domain/interfaces/post-repository.interface.js'
import { SyncMediaUsageUseCase } from '../../media/use-cases/sync-media-usage.use-case.js'
import { ITagRepository } from '../../taxonomy/domain/interfaces/tag-repository.interface.js'
import { UpdatePostDto } from '../dto/request/update-post.dto.js'
import { toAdminDetail } from '../infrastructure/mappers/post.mapper.js'
import { assertTypeSpecificFields } from './create-post.use-case.js'
import { PortalCacheService } from '../../shared/services/portal-cache.service.js'

@Injectable()
export class UpdatePostUseCase {
  private readonly logger = new Logger(UpdatePostUseCase.name)

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly sanitizer: HtmlSanitizerService,
    private readonly tagRepository: ITagRepository,
    private readonly syncMediaUsage: SyncMediaUsageUseCase,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(id: string, dto: UpdatePostDto) {
    const existing = await this.postRepository.findById(id)
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Konten dengan ID ${id} not found`)
    }

    assertTypeSpecificFields({
      type: existing.type as PostType,
      expiresAt: dto.expiresAt,
      attachmentFileId: dto.attachmentFileId,
    })

    const data: UpdatePostInput = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.summary !== undefined) data.summary = dto.summary
    if (dto.body !== undefined) data.body = this.sanitizer.sanitize(dto.body)
    if (dto.coverFileId !== undefined) data.coverFileId = dto.coverFileId
    if (dto.coverAltText !== undefined) data.coverAltText = dto.coverAltText
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId
    if (dto.metaTitle !== undefined) data.metaTitle = dto.metaTitle
    if (dto.metaDescription !== undefined) {
      data.metaDescription = dto.metaDescription
    }
    if (dto.expiresAt !== undefined) {
      data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null
    }
    if (dto.attachmentFileId !== undefined) {
      data.attachmentFileId = dto.attachmentFileId
    }

    const slugChanged = dto.slug !== undefined && dto.slug !== existing.slug
    if (slugChanged) {
      data.slug = dto.slug
    }

    if (data.metaTitle !== undefined)
      data.metaTitle = blankToNull(data.metaTitle)
    if (data.metaDescription !== undefined) {
      data.metaDescription = blankToNull(data.metaDescription)
    }

    const updated = await this.postRepository.update(id, dto.version, data)
    if (!updated) {
      throw new ConflictException(
        'This content was changed by someone else. Reload before saving.',
      )
    }

    if (dto.tags !== undefined) {
      const tags = await this.tagRepository.resolveOrCreate(dto.tags)
      await this.tagRepository.setPostTags(
        updated.id,
        tags.map((tag) => tag.id),
      )
      updated.tags = tags.map((tag) => ({ tag }))
    }

    if (slugChanged && existing.publishedAt !== null) {
      await this.postRepository.recordSlugHistory(
        updated.id,
        updated.type,
        existing.slug,
      )
    }

    await this.syncMediaUsage.execute({
      column: 'postId',
      ownerId: updated.id,
      body: updated.body,
      coverFileId: updated.coverFileId,
      attachmentFileId: updated.attachmentFileId,
    })

    if (updated.status === PUBLISHED_STATUS) {
      await this.cache.invalidate()
      this.logger.log(`Published post updated: "${updated.title}"`)
    }
    return toAdminDetail(updated)
  }
}

function blankToNull(value: string | null): string | null {
  const trimmed = value?.trim()
  if (trimmed === undefined || trimmed.length === 0) return null
  return trimmed
}
