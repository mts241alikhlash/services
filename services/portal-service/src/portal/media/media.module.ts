import { Module } from '@nestjs/common'
import { FileModule } from '../../platform/file/file.module.js'
import { IMediaUsageRepository } from './domain/interfaces/media-usage-repository.interface.js'
import { PrismaMediaUsageRepository } from './infrastructure/persistence/prisma-media-usage.repository.js'
import { MediaController } from './presentation/media.controller.js'
import { MediaPublicController } from './presentation/media-public.controller.js'
import { GetMediaLibraryUseCase } from './use-cases/get-media-library.use-case.js'
import { GetMediaUsageUseCase } from './use-cases/get-media-usage.use-case.js'
import { GetPublicMediaUseCase } from './use-cases/get-public-media.use-case.js'
import { SyncMediaUsageUseCase } from './use-cases/sync-media-usage.use-case.js'

@Module({
  imports: [FileModule],
  controllers: [MediaController, MediaPublicController],
  providers: [
    { provide: IMediaUsageRepository, useClass: PrismaMediaUsageRepository },

    SyncMediaUsageUseCase,
    GetPublicMediaUseCase,
    GetMediaUsageUseCase,
    GetMediaLibraryUseCase,
  ],
  exports: [SyncMediaUsageUseCase, IMediaUsageRepository],
})
export class MediaModule {}
