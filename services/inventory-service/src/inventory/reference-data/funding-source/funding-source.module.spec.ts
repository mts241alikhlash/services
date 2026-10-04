import { Test } from '@nestjs/testing'
import { PrismaService } from '../../../core/database/prisma.service.js'
import { PrismaModule } from '../../../core/database/prisma.module.js'
import { IFundingSourceRepository } from './index.js'
import { FundingSourceModule } from './funding-source.module.js'
import { PrismaFundingSourceRepository } from './infrastructure/persistence/prisma/prisma-funding-source.repository.js'

describe('FundingSourceModule', () => {
  it('resolves the repository port to the Prisma adapter', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, FundingSourceModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    expect(moduleRef.get(IFundingSourceRepository)).toBeInstanceOf(
      PrismaFundingSourceRepository,
    )
    await moduleRef.close()
  })
})
