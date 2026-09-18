import { Test } from '@nestjs/testing'
import { PrismaService } from '../../../core/database/prisma.service.js'
import { PrismaModule } from '../../../core/database/prisma.module.js'
import { IStatusRepository } from './index.js'
import { StatusModule } from './status.module.js'
import { PrismaStatusRepository } from './infrastructure/persistence/prisma/prisma-status.repository.js'

describe('StatusModule', () => {
  it('resolves the repository port to the Prisma adapter', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, StatusModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    expect(moduleRef.get(IStatusRepository)).toBeInstanceOf(
      PrismaStatusRepository,
    )
    await moduleRef.close()
  })
})
