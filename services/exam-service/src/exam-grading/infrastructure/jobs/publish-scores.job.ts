import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PublishScoresUseCase } from '../../application/use-cases/publish-scores/publish-scores.use-case.js'

@Injectable()
export class PublishScoresJob {
  constructor(private readonly useCase: PublishScoresUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    await this.useCase.execute()
  }
}
