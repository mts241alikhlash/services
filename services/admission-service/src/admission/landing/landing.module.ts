import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { LandingImageGarbageCollector } from './application/landing-image-garbage-collector.js'
import { DiscardLandingUseCase } from './application/use-cases/discard-landing/discard-landing.use-case.js'
import { GetLandingImageUseCase } from './application/use-cases/get-landing-image/get-landing-image.use-case.js'
import { GetLandingUseCase } from './application/use-cases/get-landing/get-landing.use-case.js'
import { PublishLandingUseCase } from './application/use-cases/publish-landing/publish-landing.use-case.js'
import { SaveLandingSectionUseCase } from './application/use-cases/save-landing-section/save-landing-section.use-case.js'
import { UploadLandingImageUseCase } from './application/use-cases/upload-landing-image/upload-landing-image.use-case.js'
import { ILandingImageProcessor } from './domain/repositories/landing-image-processor.port.js'
import { ILandingRepository } from './domain/repositories/landing-repository.js'
import { ILandingStorage } from './domain/repositories/landing-storage.port.js'
import { SharpLandingImageProcessor } from './infrastructure/image/sharp-landing-image-processor.js'
import { PrismaLandingRepository } from './infrastructure/persistence/prisma/prisma-landing.repository.js'
import { StorageLandingStorage } from './infrastructure/storage/storage-landing-storage.js'
import { AdmissionLandingPublicController } from './presentation/http/admission-landing-public.controller.js'
import { AdmissionLandingController } from './presentation/http/admission-landing.controller.js'

@Module({
  imports: [AuthModule],
  controllers: [AdmissionLandingController, AdmissionLandingPublicController],
  providers: [
    { provide: ILandingRepository, useClass: PrismaLandingRepository },
    { provide: ILandingStorage, useClass: StorageLandingStorage },
    {
      provide: ILandingImageProcessor,
      useFactory: () => new SharpLandingImageProcessor(),
    },
    LandingImageGarbageCollector,
    GetLandingUseCase,
    SaveLandingSectionUseCase,
    UploadLandingImageUseCase,
    PublishLandingUseCase,
    DiscardLandingUseCase,
    GetLandingImageUseCase,
  ],
})
export class LandingModule {}
