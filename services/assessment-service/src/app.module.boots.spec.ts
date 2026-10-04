process.env.DATABASE_URL ??= 'postgresql://boots:boots@localhost:5432/boots'
process.env.JWT_SECRET ??= 'boots-test-secret-not-a-real-key'
process.env.IDENTITY_SERVICE_URL ??= 'http://localhost:3000'
process.env.HR_SERVICE_URL ??= 'http://localhost:3800'
process.env.STUDENT_SERVICE_URL ??= 'http://localhost:3900'
process.env.PROVISIONING_SERVICE_TOKEN ??= 'boots-test-provisioning-token'
process.env.ACADEMIC_SERVICE_URL ??= 'http://localhost:3200'
process.env.PRESENCE_SERVICE_URL ??= 'http://localhost:3400'

import { Test } from '@nestjs/testing'
import { AppModule } from './app.module.js'

jest.mock('./report-card/application/services/pdf.service.js', () => ({
  PdfService: jest.fn(),
}))

describe('AppModule', () => {
  it('resolves every dependency it declares', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    expect(moduleRef).toBeDefined()
    await moduleRef.close()
  }, 120_000)
})
