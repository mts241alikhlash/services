import { Injectable } from '@nestjs/common'
import { MediaUsageKind } from '../domain/enums/media-usage-kind.enum.js'
import {
  IMediaUsageRepository,
  MediaUsageInput,
  MediaUsageOwnerColumn,
} from '../domain/interfaces/media-usage-repository.interface.js'
import { extractMediaIds } from '../infrastructure/parsers/media-reference.parser.js'

export interface SyncMediaUsageCommand {
  column: MediaUsageOwnerColumn
  ownerId: string
  body?: string | null
  coverFileId?: string | null
  attachmentFileId?: string | null
  albumPhotoFileIds?: string[]
}

@Injectable()
export class SyncMediaUsageUseCase {
  constructor(private readonly mediaUsageRepository: IMediaUsageRepository) {}

  async execute(command: SyncMediaUsageCommand): Promise<void> {
    const owner = { [command.column]: command.ownerId }
    const usages = new Map<string, MediaUsageInput>()

    const add = (fileId: string, kind: `${MediaUsageKind}`) => {
      usages.set(`${fileId}:${kind}`, { fileId, kind, ...owner })
    }

    if (command.coverFileId) add(command.coverFileId, MediaUsageKind.COVER)
    if (command.attachmentFileId) {
      add(command.attachmentFileId, MediaUsageKind.ATTACHMENT)
    }
    for (const fileId of command.albumPhotoFileIds ?? []) {
      add(fileId, MediaUsageKind.ALBUM_PHOTO)
    }
    for (const fileId of extractMediaIds(command.body ?? '')) {
      add(fileId, MediaUsageKind.BODY)
    }

    await this.mediaUsageRepository.replaceForOwner(
      command.column,
      command.ownerId,
      [...usages.values()],
    )
  }
}
