import { Module } from '@nestjs/common'
import { IProfileRepository } from './domain/repositories/profile.repository.js'
import { IProfileAddressRepository } from './domain/repositories/profile-address.repository.js'
import { PrismaProfileRepository } from './infrastructure/persistence/prisma/prisma-profile.repository.js'
import { PrismaProfileAddressRepository } from './infrastructure/persistence/prisma/prisma-profile-address.repository.js'
import { ProfileAddressService } from './application/services/profile-address.service.js'
import { GetProfileUseCase } from './application/use-cases/get-profile/get-profile.use-case.js'
import { UpdateProfileUseCase } from './application/use-cases/update-profile/update-profile.use-case.js'
import { SetProfileAvatarUseCase } from './application/use-cases/set-profile-avatar/set-profile-avatar.use-case.js'
import { ClearProfileAvatarUseCase } from './application/use-cases/clear-profile-avatar/clear-profile-avatar.use-case.js'
import { ProfileAvatarUrlService } from './application/services/profile-avatar-url.service.js'
import { ProfileController } from './presentation/http/profile.controller.js'
import { ProfileAddressController } from './presentation/http/profile-address.controller.js'
import { AddressInternalController } from './presentation/http/address-internal.controller.js'

@Module({
  controllers: [
    AddressInternalController,
    ProfileController,
    ProfileAddressController,
  ],
  providers: [
    { provide: IProfileRepository, useClass: PrismaProfileRepository },
    {
      provide: IProfileAddressRepository,
      useClass: PrismaProfileAddressRepository,
    },
    ProfileAddressService,
    GetProfileUseCase,
    UpdateProfileUseCase,
    SetProfileAvatarUseCase,
    ClearProfileAvatarUseCase,
    ProfileAvatarUrlService,
  ],
  exports: [IProfileRepository, IProfileAddressRepository],
})
export class ProfileModule {}
