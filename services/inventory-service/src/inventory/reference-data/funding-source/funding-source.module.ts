import { Module } from '@nestjs/common'
import { FundingSourceController } from './presentation/http/funding-source.controller.js'
import { PrismaFundingSourceRepository } from './infrastructure/persistence/prisma/prisma-funding-source.repository.js'
import { IFundingSourceRepository } from './domain/repositories/funding-source.repository.js'
import { CreateFundingSourceUseCase } from './application/use-cases/create-funding-source/create-funding-source.use-case.js'
import { DeleteFundingSourceUseCase } from './application/use-cases/delete-funding-source/delete-funding-source.use-case.js'
import { GetFundingSourcesUseCase } from './application/use-cases/get-funding-sources/get-funding-sources.use-case.js'
import { UpdateFundingSourceUseCase } from './application/use-cases/update-funding-source/update-funding-source.use-case.js'

@Module({
  controllers: [FundingSourceController],
  providers: [
    {
      provide: IFundingSourceRepository,
      useClass: PrismaFundingSourceRepository,
    },
    GetFundingSourcesUseCase,
    CreateFundingSourceUseCase,
    UpdateFundingSourceUseCase,
    DeleteFundingSourceUseCase,
  ],
  exports: [IFundingSourceRepository],
})
export class FundingSourceModule {}
