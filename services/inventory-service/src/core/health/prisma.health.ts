import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus'
import { PrismaService } from '../database/prisma.service.js'

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly health: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.health.check(key)
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return indicator.up()
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Unknown DB error',
      })
    }
  }
}
