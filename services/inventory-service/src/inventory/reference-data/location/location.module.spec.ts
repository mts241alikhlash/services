import { Test } from '@nestjs/testing'
import { PrismaService } from '../../../core/database/prisma.service.js'
import { PrismaModule } from '../../../core/database/prisma.module.js'
import { ILocationRepository } from './index.js'
import { LocationModule } from './location.module.js'
import { PrismaLocationRepository } from './infrastructure/persistence/prisma/prisma-location.repository.js'

describe('LocationModule', () => {
  it('resolves the repository port to the Prisma adapter', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, LocationModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    expect(moduleRef.get(ILocationRepository)).toBeInstanceOf(
      PrismaLocationRepository,
    )
    await moduleRef.close()
  })
})
