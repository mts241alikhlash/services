import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'

@Injectable()
export class PostStatusSyncService {
  private readonly logger = new Logger(PostStatusSyncService.name)

  constructor(private readonly postRepository: IPostRepository) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async normalizeDueScheduled(): Promise<void> {
    try {
      const count = await this.postRepository.normalizeDueScheduled()
      if (count > 0) {
        this.logger.log(
          `Relabelled ${count} due scheduled post(s) as published`,
        )
      }
    } catch (error) {
      this.logger.warn(
        `Status normalisation skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
}
