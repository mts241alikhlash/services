import { Module } from '@nestjs/common'
import { SchoolUnitController } from './presentation/http/school-unit.controller.js'
import { SchoolUnitAddressController } from './presentation/http/school-unit-address.controller.js'
import { SchoolUnitSocialMediaController } from './presentation/http/school-unit-social-media.controller.js'
import { SchoolUnitProfileController } from './presentation/http/school-unit-profile.controller.js'
import { ISchoolUnitRepository } from './domain/repositories/school-unit.repository.js'
import { ISchoolUnitAddressRepository } from './domain/repositories/school-unit-address.repository.js'
import { ISchoolUnitSocialMediaRepository } from './domain/repositories/school-unit-social-media.repository.js'
import { PrismaSchoolUnitRepository } from './infrastructure/persistence/prisma/prisma-school-unit.repository.js'
import { PrismaSchoolUnitAddressRepository } from './infrastructure/persistence/prisma/prisma-school-unit-address.repository.js'
import { PrismaSchoolUnitSocialMediaRepository } from './infrastructure/persistence/prisma/prisma-school-unit-social-media.repository.js'
import { GetSchoolUnitUseCase } from './application/use-cases/get-school-unit/get-school-unit.use-case.js'
import { SetupSchoolUnitUseCase } from './application/use-cases/setup-school-unit/setup-school-unit.use-case.js'
import { UpdateSchoolUnitUseCase } from './application/use-cases/update-school-unit/update-school-unit.use-case.js'
import { SchoolUnitAddressUseCase } from './application/use-cases/school-unit-address/school-unit-address.use-case.js'
import { SchoolUnitSocialMediaUseCase } from './application/use-cases/school-unit-social-media/school-unit-social-media.use-case.js'

@Module({
  controllers: [
    SchoolUnitController,
    SchoolUnitAddressController,
    SchoolUnitSocialMediaController,
    SchoolUnitProfileController,
  ],
  providers: [
    { provide: ISchoolUnitRepository, useClass: PrismaSchoolUnitRepository },
    {
      provide: ISchoolUnitAddressRepository,
      useClass: PrismaSchoolUnitAddressRepository,
    },
    {
      provide: ISchoolUnitSocialMediaRepository,
      useClass: PrismaSchoolUnitSocialMediaRepository,
    },
    GetSchoolUnitUseCase,
    SetupSchoolUnitUseCase,
    UpdateSchoolUnitUseCase,
    SchoolUnitAddressUseCase,
    SchoolUnitSocialMediaUseCase,
  ],
  exports: [
    ISchoolUnitRepository,
    ISchoolUnitAddressRepository,
    ISchoolUnitSocialMediaRepository,
    GetSchoolUnitUseCase,
  ],
})
export class SchoolUnitModule {}
