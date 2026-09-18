import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CreateAuditLogUseCase } from '../../application/use-cases/create-audit-log/create-audit-log.use-case.js'
import { IngestAuditLogDto } from './dto/request/ingest-audit-log.dto.js'
import { AuditLogIngestController } from './audit-log-ingest.controller.js'

describe('AuditLogIngestController', () => {
  let controller: AuditLogIngestController

  const mockCreateAuditLogUseCase = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogIngestController],
      providers: [
        { provide: CreateAuditLogUseCase, useValue: mockCreateAuditLogUseCase },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile()

    controller = module.get<AuditLogIngestController>(AuditLogIngestController)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('ingest', () => {
    it('delegates to CreateAuditLogUseCase with the dto', async () => {
      const dto: IngestAuditLogDto = {
        userId: 'u-1',
        action: 'daily-record.correct',
        resource: 'daily-records',
      }
      const created = { id: 'log-1', ...dto, createdAt: new Date() }
      mockCreateAuditLogUseCase.execute.mockResolvedValue(created)

      const result = await controller.ingest(dto)

      expect(mockCreateAuditLogUseCase.execute).toHaveBeenCalledWith(dto)
      expect(result).toEqual(created)
    })
  })
})
