import { Injectable, NotFoundException } from '@nestjs/common'
import { RELATED_POST_LIMIT } from '../constants/post.constants.js'
import { PostType } from '../domain/enums/post-type.enum.js'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'
import { PostSummaryDto } from '../dto/response/post-detail.dto.js'
import { toPublicSummary } from '../infrastructure/mappers/post.mapper.js'

@Injectable()
export class GetRelatedPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(type: `${PostType}`, slug: string): Promise<PostSummaryDto[]> {
    const anchor = await this.postRepository.findPublicBySlug(type, slug)
    if (!anchor) {
      throw new NotFoundException('Page not found')
    }

    const related = await this.postRepository.findRelated({
      type,
      excludeId: anchor.id,
      categoryId: anchor.categoryId,
      take: RELATED_POST_LIMIT,
    })

    return related.map(toPublicSummary)
  }
}
