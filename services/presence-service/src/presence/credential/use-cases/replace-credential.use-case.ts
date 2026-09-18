import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CredentialWithCode } from '../domain/entities/credential.entity.js'
import { ICredentialRepository } from '../domain/interfaces/credential-repository.interface.js'
import { RevokeCredentialDto } from '../dto/request/revoke-credential.dto.js'
import { CredentialCodeService } from '../services/credential-code.service.js'

@Injectable()
export class ReplaceCredentialUseCase {
  constructor(
    private readonly credentialRepository: ICredentialRepository,
    private readonly codes: CredentialCodeService,
  ) {}

  async execute(
    id: string,
    dto: RevokeCredentialDto,
    issuedBy: string,
  ): Promise<CredentialWithCode> {
    const previous = await this.credentialRepository.findById(id)

    if (!previous) {
      throw new NotFoundException('Card not found')
    }

    if (previous.status !== 'ACTIVE') {
      throw new ConflictException(
        'Only an active card can be replaced. Issue a new one instead.',
      )
    }

    return this.credentialRepository.replace({
      previousId: previous.id,
      userId: previous.userId,
      subjectType: previous.subjectType,
      code: this.codes.generate(),
      issuedBy,
      revokedAt: new Date(),
      revokedReason: dto.reason,
    })
  }
}
