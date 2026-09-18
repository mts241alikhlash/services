import { MediaUsageKind } from '../enums/media-usage-kind.enum.js'

export interface MediaUsageInput {
  fileId: string
  kind: `${MediaUsageKind}`
  postId?: string | null
  agendaId?: string | null
  albumId?: string | null
  pageId?: string | null
}

export interface MediaUsageOwner {
  kind: `${MediaUsageKind}`
  ownerType: 'post' | 'agenda' | 'album' | 'page'
  ownerId: string
  title: string
  isPublic: boolean
}

export type MediaUsageOwnerColumn = 'postId' | 'agendaId' | 'albumId' | 'pageId'

export abstract class IMediaUsageRepository {
  abstract replaceForOwner(
    column: MediaUsageOwnerColumn,
    ownerId: string,
    usages: MediaUsageInput[],
  ): Promise<void>

  abstract isPubliclyReferenced(fileId: string, now?: Date): Promise<boolean>

  abstract findOwners(fileId: string, now?: Date): Promise<MediaUsageOwner[]>

  abstract countUsagesForFile(fileId: string): Promise<number>
}
