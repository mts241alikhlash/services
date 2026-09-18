import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus'
import { PrismaHealthIndicator } from './prisma.health.js'
import { Public } from '../decorators/public.decorator.js'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @Public()
  @ApiOperation({ summary: 'Liveness + readiness probe (DB, memory)' })
  @ApiResponse({
    status: 200,
    description: 'Liveness and readiness check passed',
  })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
    ])
  }
}
