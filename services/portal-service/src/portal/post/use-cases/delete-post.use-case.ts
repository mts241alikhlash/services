import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { POST_AUDIT_ACTIONS } from '../constants/post.constants.js'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'
import { PostAuditService } from '../services/post-audit.service.js'
import { PortalCacheService } from '../../shared/services/portal-cache.service.js'

@Injectable()
export class DeletePostUseCase {
  private readonly logger = new Logger(DeletePostUseCase.name)

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly audit: PostAuditService,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(id: string, actorId: string | null): Promise<void> {
    const existing = await this.postRepository.findById(id)
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Konten dengan ID ${id} not found`)
    }

    await this.postRepository.softDelete(id)
    await this.audit.record(POST_AUDIT_ACTIONS.DELETE, existing, actorId)
    await this.cache.invalidate()

    this.logger.log(`Post soft-deleted: "${existing.title}"`)
  }
}
