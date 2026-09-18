import { Injectable } from '@nestjs/common'
import { IMediaUsageRepository } from '../domain/interfaces/media-usage-repository.interface.js'

@Injectable()
export class GetMediaUsageUseCase {
  constructor(private readonly mediaUsageRepository: IMediaUsageRepository) {}

  async execute(fileId: string) {
    const owners = await this.mediaUsageRepository.findOwners(fileId)

    return {
      fileId,
      isPubliclyReachable: owners.some((owner) => owner.isPublic),
      usedBy: owners,
    }
  }
}
