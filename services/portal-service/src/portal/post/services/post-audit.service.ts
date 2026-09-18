import { Injectable, Logger } from '@nestjs/common'
import { CreateAuditLogUseCase } from '../../../platform/audit-log/use-cases/create-audit-log.use-case.js'
import { PostWithDetails } from '../domain/interfaces/post-repository.interface.js'
import { AUDIT_RESOURCE, PostAuditAction } from '../constants/post.constants.js'

@Injectable()
export class PostAuditService {
  private readonly logger = new Logger(PostAuditService.name)

  constructor(private readonly createAuditLog: CreateAuditLogUseCase) {}

  async record(
    action: PostAuditAction,
    post: Pick<PostWithDetails, 'id' | 'type' | 'title' | 'slug'>,
    actorId: string | null,
  ): Promise<void> {
    try {
      await this.createAuditLog.execute({
        userId: actorId,
        action,
        resource: AUDIT_RESOURCE,
        resourceId: post.id,
        metadata: { type: post.type, title: post.title, slug: post.slug },
      })
    } catch (error) {
      this.logger.error(
        `Audit write failed for ${action} on post ${post.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
}
