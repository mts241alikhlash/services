import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { RESTORE_WINDOW_DAYS } from '../constants/post.constants.js'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'
import { toAdminDetail } from '../infrastructure/mappers/post.mapper.js'
import { PortalCacheService } from '../../shared/services/portal-cache.service.js'

const DAY_IN_MS = 24 * 60 * 60 * 1000

@Injectable()
export class RestorePostUseCase {
  private readonly logger = new Logger(RestorePostUseCase.name)

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(id: string, now: Date = new Date()) {
    const existing = await this.postRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Konten dengan ID ${id} not found`)
    }

    if (!existing.deletedAt) {
      throw new BadRequestException('This content is not in the trash')
    }

    const elapsedDays =
      (now.getTime() - existing.deletedAt.getTime()) / DAY_IN_MS
    if (elapsedDays > RESTORE_WINDOW_DAYS) {
      throw new BadRequestException(
        `Content can only be restored within ${RESTORE_WINDOW_DAYS} days of deletion`,
      )
    }

    const restored = await this.postRepository.restore(id)

    await this.cache.invalidate()

    this.logger.log(`Post restored to ${restored.status}: "${restored.title}"`)
    return toAdminDetail(restored)
  }
}
