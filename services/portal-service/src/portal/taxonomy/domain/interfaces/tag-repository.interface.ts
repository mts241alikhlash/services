export interface PostTagEntity {
  id: string
  name: string
  slug: string
}

export interface CreateTagInput {
  name: string
  slug: string
}

export abstract class ITagRepository {
  abstract findAll(search?: string): Promise<PostTagEntity[]>

  abstract findById(id: string): Promise<PostTagEntity | null>

  abstract findBySlug(slug: string): Promise<PostTagEntity | null>

  abstract create(data: CreateTagInput): Promise<PostTagEntity>

  abstract rename(id: string, name: string): Promise<PostTagEntity>

  abstract delete(id: string): Promise<void>

  abstract resolveOrCreate(names: string[]): Promise<PostTagEntity[]>

  abstract setPostTags(postId: string, tagIds: string[]): Promise<void>

  abstract findByPostId(postId: string): Promise<PostTagEntity[]>
}
