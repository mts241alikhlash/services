import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  IProfileRepository,
  UpdateProfileRepositoryInput,
} from '../../../domain/repositories/profile.repository.js'
import { UpdateProfileInput } from './update-profile.input.js'

@Injectable()
export class UpdateProfileUseCase {
  private readonly logger = new Logger(UpdateProfileUseCase.name)

  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(userId: string, input: UpdateProfileInput) {
    const profile = await this.profileRepository.findByUserId(userId)
    if (!profile) {
      throw new NotFoundException(`Profile for user ID ${userId} not found`)
    }

    await this.assertUnique(userId, input)
    await this.assertReferences(input)

    const { birthDate, ...rest } = input
    const data: UpdateProfileRepositoryInput = {
      ...rest,
      ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
    }

    const updated = await this.profileRepository.update(userId, data)
    this.logger.log(`Profile updated for user ${userId}`)
    return updated
  }

  private async assertUnique(userId: string, input: UpdateProfileInput) {
    if (input.nik !== undefined) {
      const taken = await this.profileRepository.findByNik(input.nik, userId)
      if (taken) {
        throw new ConflictException(`NIK "${input.nik}" is already registered`)
      }
    }

    if (input.email !== undefined) {
      const taken = await this.profileRepository.findByEmail(
        input.email,
        userId,
      )
      if (taken) {
        throw new ConflictException(
          `Email "${input.email}" is already registered`,
        )
      }
    }

    if (input.phone !== undefined) {
      const taken = await this.profileRepository.findByPhone(
        input.phone,
        userId,
      )
      if (taken) {
        throw new ConflictException(
          `Phone "${input.phone}" is already registered`,
        )
      }
    }
  }

  private async assertReferences(input: UpdateProfileInput) {
    if (input.religionId !== undefined) {
      const exists = await this.profileRepository.referenceExists(
        'religion',
        input.religionId,
      )
      if (!exists) {
        throw new BadRequestException(
          `Religion "${input.religionId}" does not exist`,
        )
      }
    }

    if (input.bloodTypeId !== undefined) {
      const exists = await this.profileRepository.referenceExists(
        'bloodType',
        input.bloodTypeId,
      )
      if (!exists) {
        throw new BadRequestException(
          `Blood type "${input.bloodTypeId}" does not exist`,
        )
      }
    }
  }
}
