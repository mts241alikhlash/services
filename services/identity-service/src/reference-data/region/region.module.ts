import { Module } from '@nestjs/common'
import { IRegionRepository } from './domain/repositories/region.repository.js'
import { PrismaRegionRepository } from './infrastructure/persistence/prisma/prisma-region.repository.js'
import { RegionController } from './presentation/http/region.controller.js'

@Module({
  controllers: [RegionController],
  providers: [{ provide: IRegionRepository, useClass: PrismaRegionRepository }],
  exports: [IRegionRepository],
})
export class RegionModule {}
