import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { toPlainSummary } from '../../../shared/helpers/plain-summary.helper.js'
import { IAgendaRepository } from '../../agenda/domain/interfaces/agenda-repository.interface.js'
import { IGalleryRepository } from '../../gallery/domain/interfaces/gallery-repository.interface.js'
import { GetPublicPageUseCase } from '../../page/use-cases/get-public-page.use-case.js'
import { PUBLIC_MEDIA_PATH } from '../../post/constants/post.constants.js'
import { GetPublicPostBySlugUseCase } from '../../post/use-cases/get-public-post-by-slug.use-case.js'
import {
  PORTAL_DEFAULT_META,
  PREVIEW_VARIANT,
  postTypeFromPath,
} from '../constants/meta.constants.js'
import { PageMetaDto } from '../dto/response/page-meta.dto.js'

interface ResolvedMeta {
  title: string
  description: string
  coverFileId: string | null
  publishedAt: Date | null
}

@Injectable()
export class GetPageMetaUseCase {
  constructor(
    private readonly getPublicPostBySlug: GetPublicPostBySlugUseCase,
    private readonly getPublicPage: GetPublicPageUseCase,
    private readonly agendaRepository: IAgendaRepository,
    private readonly galleryRepository: IGalleryRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(path: string): Promise<PageMetaDto> {
    const canonicalUrl = this.absolute(path)
    const segments = path.split('/').filter(Boolean)

    if (segments.length === 0) {
      return this.siteCard(canonicalUrl)
    }

    const resolved = await this.resolve(segments)

    if (resolved === 'listing') return this.siteCard(canonicalUrl)

    if (resolved === null) {
      throw new NotFoundException('Page not found')
    }

    return {
      title: resolved.title,
      description: resolved.description,
      canonicalUrl,
      imageUrl: resolved.coverFileId
        ? `${this.absolute(`${PUBLIC_MEDIA_PATH}/${resolved.coverFileId}`)}?variant=${PREVIEW_VARIANT}`
        : null,
      type: 'article',
      publishedAt: resolved.publishedAt,
    }
  }

  private async resolve(
    segments: string[],
  ): Promise<ResolvedMeta | 'listing' | null> {
    const [first, second] = segments

    if (segments.length === 1) {
      if (postTypeFromPath(first) || first === 'agenda' || first === 'galeri') {
        return 'listing'
      }
      return this.resolvePage(first)
    }

    if (segments.length !== 2) return null

    const postType = postTypeFromPath(first)
    if (postType) return this.resolvePost(postType, second)
    if (first === 'agenda') return this.resolveAgenda(second)
    if (first === 'galeri') return this.resolveAlbum(second)

    return null
  }

  private async resolvePost(
    type: Parameters<GetPublicPostBySlugUseCase['executeOrThrow']>[0],
    slug: string,
  ): Promise<ResolvedMeta | null> {
    const post = await this.getPublicPostBySlug
      .executeOrThrow(type, slug)
      .catch(() => null)
    if (!post) return null

    return {
      title: post.metaTitle,
      description: post.metaDescription,
      coverFileId: post.coverImageUrl?.split('/').pop() ?? null,
      publishedAt: post.publishedAt,
    }
  }

  private async resolveAgenda(slug: string): Promise<ResolvedMeta | null> {
    const entry = await this.agendaRepository.findPublicBySlug(slug)
    if (!entry) return null

    return {
      title: entry.title,
      description: toPlainSummary(entry.description),
      coverFileId: entry.coverFileId,
      publishedAt: entry.publishedAt,
    }
  }

  private async resolveAlbum(slug: string): Promise<ResolvedMeta | null> {
    const album = await this.galleryRepository.findPublicAlbumBySlug(slug)
    if (!album) return null

    return {
      title: album.title,
      description: toPlainSummary(album.description),
      coverFileId: album.coverFileId,
      publishedAt: album.publishedAt,
    }
  }

  private async resolvePage(slug: string): Promise<ResolvedMeta | null> {
    const result = await this.getPublicPage.execute(slug).catch(() => null)
    if (result?.kind !== 'found') return null

    return {
      title: result.page.metaTitle,
      description: result.page.metaDescription,
      coverFileId: null,
      publishedAt: result.page.publishedAt,
    }
  }

  private siteCard(canonicalUrl: string): PageMetaDto {
    return {
      ...PORTAL_DEFAULT_META,
      canonicalUrl,
      imageUrl: null,
      type: 'website',
      publishedAt: null,
    }
  }

  private absolute(path: string): string {
    const base = (
      this.config.get<string>('PORTAL_BASE_URL') ?? 'http://localhost:5176'
    ).replace(/\/+$/, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }
}
