import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CredentialEntity } from '../domain/entities/credential.entity.js'
import { ICredentialRepository } from '../domain/interfaces/credential-repository.interface.js'
import { RevokeCredentialDto } from '../dto/request/revoke-credential.dto.js'

@Injectable()
export class RevokeCredentialUseCase {
  constructor(private readonly credentialRepository: ICredentialRepository) {}

  async execute(
    id: string,
    dto: RevokeCredentialDto,
  ): Promise<CredentialEntity> {
    const credential = await this.credentialRepository.findById(id)

    if (!credential) {
      throw new NotFoundException('Card not found')
    }

    if (credential.status !== 'ACTIVE') {
      throw new ConflictException('This card is already inactive')
    }

    return this.credentialRepository.revoke(id, {
      revokedAt: new Date(),
      revokedReason: dto.reason,
    })
  }
}
