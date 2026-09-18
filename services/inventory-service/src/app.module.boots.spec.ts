process.env.DATABASE_URL ??= 'postgresql://boots:boots@localhost:5432/boots'
process.env.JWT_SECRET ??= 'boots-test-secret-not-a-real-key'
process.env.IDENTITY_SERVICE_URL ??= 'https://identity.internal'
process.env.S3_ENDPOINT ??= 'http://localhost:9000'
process.env.S3_BUCKET ??= 'boots'
process.env.S3_ACCESS_KEY_ID ??= 'boots'
process.env.S3_SECRET_ACCESS_KEY ??= 'boots'

import { Test } from '@nestjs/testing'
import { AppModule } from './app.module.js'

describe('AppModule', () => {
  it('resolves every dependency it declares', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    expect(moduleRef).toBeDefined()
    await moduleRef.close()
  }, 120_000)
})
