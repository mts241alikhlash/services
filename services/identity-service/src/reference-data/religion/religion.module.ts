import { Module } from '@nestjs/common'
import { IReligionRepository } from './domain/repositories/religion.repository.js'
import { PrismaReligionRepository } from './infrastructure/persistence/prisma/prisma-religion.repository.js'
import { GetReligionsUseCase } from './application/use-cases/get-religions/get-religions.use-case.js'
import { GetReligionByIdUseCase } from './application/use-cases/get-religion-by-id/get-religion-by-id.use-case.js'
import { CreateReligionUseCase } from './application/use-cases/create-religion/create-religion.use-case.js'
import { UpdateReligionUseCase } from './application/use-cases/update-religion/update-religion.use-case.js'
import { DeleteReligionUseCase } from './application/use-cases/delete-religion/delete-religion.use-case.js'
import { ReligionController } from './presentation/http/religion.controller.js'
import { ReligionInternalController } from './presentation/http/religion-internal.controller.js'

@Module({
  controllers: [ReligionInternalController, ReligionController],
  providers: [
    { provide: IReligionRepository, useClass: PrismaReligionRepository },
    GetReligionsUseCase,
    GetReligionByIdUseCase,
    CreateReligionUseCase,
    UpdateReligionUseCase,
    DeleteReligionUseCase,
  ],
  exports: [IReligionRepository],
})
export class ReligionModule {}
