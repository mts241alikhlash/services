import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { SyncMediaUsageUseCase } from '../../media/use-cases/sync-media-usage.use-case.js'
import { IGalleryRepository } from '../domain/interfaces/gallery-repository.interface.js'
import {
  AddPhotoDto,
  ReorderPhotosDto,
  UpdatePhotoDto,
} from '../dto/request/gallery.dto.js'
import { toAdminPhoto } from '../infrastructure/mappers/gallery.mapper.js'
import { PortalCacheService } from '../../shared/services/portal-cache.service.js'

@Injectable()
export class AddPhotoUseCase {
  private readonly logger = new Logger(AddPhotoUseCase.name)

  constructor(
    private readonly galleryRepository: IGalleryRepository,
    private readonly syncMediaUsage: SyncMediaUsageUseCase,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(albumId: string, dto: AddPhotoDto) {
    const album = await this.assertAlbum(albumId)

    if (!dto.altText.trim()) {
      throw new BadRequestException('Alt text is required')
    }

    const photo = await this.galleryRepository.addPhoto({
      albumId,
      fileId: dto.fileId,
      altText: dto.altText.trim(),
      caption: dto.caption ?? null,
    })

    await syncAlbumMedia(
      this.galleryRepository,
      this.syncMediaUsage,
      albumId,
      album.coverFileId,
    )

    if (album.publishedAt !== null) await this.cache.invalidate()

    this.logger.log(`Photo added to album "${album.title}"`)
    return toAdminPhoto(photo)
  }

  private async assertAlbum(albumId: string) {
    const album = await this.galleryRepository.findAlbumById(albumId)
    if (!album || album.deletedAt) {
      throw new NotFoundException(`Album ${albumId} not found`)
    }
    return album
  }
}

@Injectable()
export class UpdatePhotoUseCase {
  constructor(
    private readonly galleryRepository: IGalleryRepository,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(albumId: string, photoId: string, dto: UpdatePhotoDto) {
    const album = await this.galleryRepository.findAlbumById(albumId)
    if (!album || album.deletedAt) {
      throw new NotFoundException(`Album ${albumId} not found`)
    }

    if (dto.altText !== undefined && !dto.altText.trim()) {
      throw new BadRequestException('Alt text is required')
    }

    const photo = await this.galleryRepository.updatePhoto(albumId, photoId, {
      ...(dto.caption !== undefined
        ? { caption: dto.caption?.trim() ? dto.caption.trim() : null }
        : {}),
      ...(dto.altText !== undefined ? { altText: dto.altText.trim() } : {}),
    })

    if (!photo) {
      throw new NotFoundException(
        `Photo ${photoId} does not belong to this album`,
      )
    }

    if (album.publishedAt !== null) await this.cache.invalidate()

    return toAdminPhoto(photo)
  }
}

@Injectable()
export class RemovePhotoUseCase {
  constructor(
    private readonly galleryRepository: IGalleryRepository,
    private readonly syncMediaUsage: SyncMediaUsageUseCase,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(albumId: string, photoId: string): Promise<void> {
    const album = await this.galleryRepository.findAlbumById(albumId)
    if (!album || album.deletedAt) {
      throw new NotFoundException(`Album ${albumId} not found`)
    }

    await this.galleryRepository.removePhoto(albumId, photoId)

    await syncAlbumMedia(
      this.galleryRepository,
      this.syncMediaUsage,
      albumId,
      album.coverFileId,
    )

    if (album.publishedAt !== null) await this.cache.invalidate()
  }
}

@Injectable()
export class ReorderPhotosUseCase {
  constructor(
    private readonly galleryRepository: IGalleryRepository,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(albumId: string, dto: ReorderPhotosDto): Promise<void> {
    const album = await this.galleryRepository.findAlbumById(albumId)
    if (!album || album.deletedAt) {
      throw new NotFoundException(`Album ${albumId} not found`)
    }

    const known = new Set(await this.galleryRepository.findPhotoIds(albumId))
    const unknown = dto.photoIds.filter((id) => !known.has(id))
    if (unknown.length > 0) {
      throw new BadRequestException(
        'The order references a photo that is not in this album. Reload the album.',
      )
    }

    await this.galleryRepository.reorderPhotos(albumId, dto.photoIds)

    if (album.publishedAt !== null) await this.cache.invalidate()
  }
}

async function syncAlbumMedia(
  repository: IGalleryRepository,
  syncMediaUsage: SyncMediaUsageUseCase,
  albumId: string,
  coverFileId: string | null,
): Promise<void> {
  const fileIds = await repository.findPhotoFileIds(albumId)
  await syncMediaUsage.execute({
    column: 'albumId',
    ownerId: albumId,
    coverFileId,
    albumPhotoFileIds: fileIds,
  })
}
