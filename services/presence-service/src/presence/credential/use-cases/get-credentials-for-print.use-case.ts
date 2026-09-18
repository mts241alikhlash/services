import { BadRequestException, Injectable } from '@nestjs/common'
import { CredentialWithCode } from '../domain/entities/credential.entity.js'
import { ICredentialRepository } from '../domain/interfaces/credential-repository.interface.js'

const MAX_PRINT_BATCH = 200

@Injectable()
export class GetCredentialsForPrintUseCase {
  constructor(private readonly credentialRepository: ICredentialRepository) {}

  async execute(userIds: string[]): Promise<CredentialWithCode[]> {
    if (userIds.length === 0) {
      throw new BadRequestException('Select at least one person to print for')
    }

    if (userIds.length > MAX_PRINT_BATCH) {
      throw new BadRequestException(
        `Print at most ${MAX_PRINT_BATCH} cards at a time`,
      )
    }

    return this.credentialRepository.findForPrint(userIds)
  }
}
