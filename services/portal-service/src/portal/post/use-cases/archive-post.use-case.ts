import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'
import { PostVersionDto } from '../dto/request/post-version.dto.js'
import { toAdminDetail } from '../infrastructure/mappers/post.mapper.js'
import { PortalCacheService } from '../../shared/services/portal-cache.service.js'

@Injectable()
export class ArchivePostUseCase {
  private readonly logger = new Logger(ArchivePostUseCase.name)

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(id: string, dto: PostVersionDto) {
    const existing = await this.postRepository.findById(id)
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Konten dengan ID ${id} not found`)
    }

    const updated = await this.postRepository.archive(id, dto.version)
    if (!updated) {
      throw new ConflictException(
        'This content was changed by someone else. Reload before archiving.',
      )
    }

    await this.cache.invalidate()

    this.logger.log(`Post archived: "${updated.title}"`)
    return toAdminDetail(updated)
  }
}
