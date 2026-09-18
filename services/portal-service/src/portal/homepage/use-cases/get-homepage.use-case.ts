import { Injectable, Logger } from '@nestjs/common'
import { IAgendaRepository } from '../../agenda/domain/interfaces/agenda-repository.interface.js'
import { toPublicAgenda } from '../../agenda/infrastructure/mappers/agenda.mapper.js'
import { IGalleryRepository } from '../../gallery/domain/interfaces/gallery-repository.interface.js'
import { toPublicAlbumSummary } from '../../gallery/infrastructure/mappers/gallery.mapper.js'
import { IPostRepository } from '../../post/domain/interfaces/post-repository.interface.js'
import { toPublicSummary } from '../../post/infrastructure/mappers/post.mapper.js'
import { IHomepageSectionRepository } from '../domain/interfaces/homepage-section-repository.interface.js'
import {
  HomepageResponseDto,
  HomepageSectionDto,
} from '../dto/response/homepage-response.dto.js'
import {
  HOMEPAGE_SECTION_KEYS,
  POST_BACKED_SECTIONS,
} from '../constants/homepage.constants.js'

@Injectable()
export class GetHomepageUseCase {
  private readonly logger = new Logger(GetHomepageUseCase.name)

  constructor(
    private readonly sectionRepository: IHomepageSectionRepository,
    private readonly postRepository: IPostRepository,
    private readonly agendaRepository: IAgendaRepository,
    private readonly galleryRepository: IGalleryRepository,
  ) {}

  async execute(): Promise<HomepageResponseDto> {
    const sections = await this.sectionRepository.findAllEnabled()

    const settled = await Promise.allSettled(
      sections.map((section) => this.resolveSection(section)),
    )

    const resolved = settled.map((outcome, index) => {
      if (outcome.status === 'fulfilled') return outcome.value

      const section = sections[index]
      this.logger.error(
        `Homepage section "${section.key}" could not be retrieved: ${
          outcome.reason instanceof Error
            ? outcome.reason.message
            : String(outcome.reason)
        }`,
      )

      return {
        key: section.key,
        displayOrder: section.displayOrder,
        kind: 'post' as const,
        items: [],
      }
    })

    return { sections: resolved }
  }

  private async resolveSection(section: {
    key: string
    itemCount: number
    displayOrder: number
  }): Promise<HomepageSectionDto> {
    const base = { key: section.key, displayOrder: section.displayOrder }

    if (section.key === HOMEPAGE_SECTION_KEYS.AGENDA) {
      const entries = await this.agendaRepository.findUpcoming(
        section.itemCount,
      )
      return { ...base, kind: 'agenda', items: entries.map(toPublicAgenda) }
    }

    if (section.key === HOMEPAGE_SECTION_KEYS.GALERI) {
      const albums = await this.galleryRepository.findLatestPublicAlbums(
        section.itemCount,
      )
      return {
        ...base,
        kind: 'album',
        items: albums.map(toPublicAlbumSummary),
      }
    }

    const postType = POST_BACKED_SECTIONS[section.key]
    if (!postType) {
      return { ...base, kind: 'album', items: [] }
    }

    const posts = await this.postRepository.findLatestPublic(
      postType,
      section.itemCount,
    )

    return { ...base, kind: 'post', items: posts.map(toPublicSummary) }
  }
}
