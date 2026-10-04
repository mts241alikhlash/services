import { Injectable } from '@nestjs/common'
import { IAgendaRepository } from '../../agenda/domain/interfaces/agenda-repository.interface.js'
import { IGalleryRepository } from '../../gallery/domain/interfaces/gallery-repository.interface.js'
import { IPageRepository } from '../../page/domain/interfaces/page-repository.interface.js'
import { IPostRepository } from '../../post/domain/interfaces/post-repository.interface.js'
import { POST_TYPE_TO_PUBLIC_PATH } from '../constants/meta.constants.js'
import { SitemapEntryDto } from '../dto/response/page-meta.dto.js'

const STATIC_PATHS = [
  '/',
  '/berita',
  '/artikel',
  '/pengumuman',
  '/agenda',
  '/galeri',
]

@Injectable()
export class GetSitemapUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly agendaRepository: IAgendaRepository,
    private readonly galleryRepository: IGalleryRepository,
    private readonly pageRepository: IPageRepository,
  ) {}

  async execute(now: Date = new Date()): Promise<SitemapEntryDto[]> {
    const [posts, agenda, albums, pages] = await Promise.all([
      this.postRepository.findAllVisibleForSitemap(now),
      this.agendaRepository.findAllVisible(now),
      this.galleryRepository.findAllVisibleAlbums(now),
      this.pageRepository.findAllVisible(now),
    ])

    const items: SitemapEntryDto[] = [
      ...posts.map((post) => ({
        path: `/${POST_TYPE_TO_PUBLIC_PATH[post.type]}/${post.slug}`,
        lastModified: post.updatedAt,
      })),
      ...agenda.map((entry) => ({
        path: `/agenda/${entry.slug}`,
        lastModified: entry.updatedAt,
      })),
      ...albums.map((album) => ({
        path: `/galeri/${album.slug}`,
        lastModified: album.updatedAt,
      })),
      ...pages.map((page) => ({
        path: `/${page.slug}`,
        lastModified: page.updatedAt,
      })),
    ]

    const newest = items.reduce<Date | null>(
      (latest, item) =>
        latest === null || item.lastModified > latest
          ? item.lastModified
          : latest,
      null,
    )

    const statics = STATIC_PATHS.map((path) => ({
      path,
      lastModified: newest ?? now,
    }))

    return [...statics, ...items]
  }
}
