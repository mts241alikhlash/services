import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { FinalizeDueSessionsUseCase } from '../../application/use-cases/finalize-due-sessions/finalize-due-sessions.use-case.js'

@Injectable()
export class FinalizeDueSessionsJob {
  constructor(private readonly useCase: FinalizeDueSessionsUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    await this.useCase.execute()
  }
}
