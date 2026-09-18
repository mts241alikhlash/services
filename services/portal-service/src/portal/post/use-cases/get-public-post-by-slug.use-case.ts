import { Injectable, NotFoundException } from '@nestjs/common'
import { PostType } from '../domain/enums/post-type.enum.js'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'
import { PostDetailDto } from '../dto/response/post-detail.dto.js'
import { toPublicDetail } from '../infrastructure/mappers/post.mapper.js'

export type PublicPostResult =
  { kind: 'found'; post: PostDetailDto } | { kind: 'moved'; slug: string }

@Injectable()
export class GetPublicPostBySlugUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(type: `${PostType}`, slug: string): Promise<PublicPostResult> {
    const post = await this.postRepository.findPublicBySlug(type, slug)
    if (post) {
      return { kind: 'found', post: toPublicDetail(post) }
    }

    const moved = await this.postRepository.findByHistoricalSlug(type, slug)
    if (moved) {
      return { kind: 'moved', slug: moved.currentSlug }
    }

    throw new NotFoundException('Page not found')
  }

  async executeOrThrow(
    type: `${PostType}`,
    slug: string,
  ): Promise<PostDetailDto> {
    const result = await this.execute(type, slug)
    if (result.kind === 'found') return result.post

    throw new NotFoundException('Page not found')
  }
}
