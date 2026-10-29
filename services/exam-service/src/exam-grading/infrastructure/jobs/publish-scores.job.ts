import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PublishScoresUseCase } from '../../application/use-cases/publish-scores/publish-scores.use-case.js'

@Injectable()
export class PublishScoresJob {
  private running = false

  constructor(private readonly useCase: PublishScoresUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    if (this.running) return
    this.running = true
    try {
      await this.useCase.execute()
    } finally {
      this.running = false
    }
  }
}
