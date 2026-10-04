import { Test } from '@nestjs/testing'
import { PrismaService } from '../../../../../../core/database/prisma.service.js'
import { PrismaModule } from '../../../../../../core/database/prisma.module.js'
import { ConditionModule } from '../../../condition.module.js'
import { IConditionRepository } from '../../../domain/repositories/condition.repository.js'
import { PrismaConditionRepository } from './prisma-condition.repository.js'

describe('ConditionModule', () => {
  it('resolves the repository port to the Prisma adapter', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, ConditionModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    expect(moduleRef.get(IConditionRepository)).toBeInstanceOf(
      PrismaConditionRepository,
    )
    await moduleRef.close()
  })
})
