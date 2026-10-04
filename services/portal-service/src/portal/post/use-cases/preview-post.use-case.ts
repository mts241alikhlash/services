import { Injectable, NotFoundException } from '@nestjs/common'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'
import { PostDetailDto } from '../dto/response/post-detail.dto.js'
import { toPublicDetail } from '../infrastructure/mappers/post.mapper.js'

@Injectable()
export class PreviewPostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(id: string): Promise<PostDetailDto> {
    const post = await this.postRepository.findById(id)

    if (!post || post.deletedAt) {
      throw new NotFoundException(`Konten dengan ID ${id} not found`)
    }

    return {
      ...toPublicDetail(post),
      publishedAt: post.publishedAt ?? new Date(),
    }
  }
}
