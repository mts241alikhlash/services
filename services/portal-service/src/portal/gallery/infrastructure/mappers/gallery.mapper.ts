import { PUBLIC_MEDIA_PATH } from '../../../post/constants/post.constants.js'
import {
  GalleryAlbumRow,
  GalleryAlbumWithCount,
  GalleryPhotoRow,
} from '../../domain/interfaces/gallery-repository.interface.js'

function mediaUrl(fileId: string | null): string | null {
  return fileId ? `${PUBLIC_MEDIA_PATH}/${fileId}` : null
}

export function toPublicAlbumSummary(album: GalleryAlbumWithCount) {
  return {
    id: album.id,
    title: album.title,
    slug: album.slug,
    description: album.description,
    eventDate: album.eventDate,
    coverImageUrl: mediaUrl(album.coverFileId),
    photoCount: album.photoCount,
    publishedAt: album.publishedAt!,
  }
}

export function toPublicPhoto(photo: GalleryPhotoRow) {
  return {
    id: photo.id,
    imageUrl: `${PUBLIC_MEDIA_PATH}/${photo.fileId}`,
    caption: photo.caption,
    altText: photo.altText,
    displayOrder: photo.displayOrder,
  }
}

export function toAdminAlbum(album: GalleryAlbumRow) {
  return { ...album, coverImageUrl: mediaUrl(album.coverFileId) }
}

export function toAdminPhoto(photo: GalleryPhotoRow) {
  return { ...photo, imageUrl: `${PUBLIC_MEDIA_PATH}/${photo.fileId}` }
}
