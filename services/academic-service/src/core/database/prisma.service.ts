import {
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { pgSslOptions } from '../../../prisma/pg-ssl.js'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy, BeforeApplicationShutdown
{
  private readonly logger = new Logger(PrismaService.name)
  private isDisconnected = false

  constructor(private readonly configService: ConfigService) {
    const connectionString =
      configService.get<string>('DATABASE_URL') ??
      configService.get<string>('DIRECT_URL')
    const adapter = new PrismaPg({
      connectionString,
      ...pgSslOptions(connectionString),
    })
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.disconnect('onModuleDestroy')
  }

  async beforeApplicationShutdown(signal?: string) {
    await this.disconnect(`beforeApplicationShutdown:${signal}`)
  }

  private async disconnect(context: string) {
    if (this.isDisconnected) {
      return
    }
    this.isDisconnected = true
    this.logger.log(`Disconnecting Prisma client (${context})`)
    await this.$disconnect()
  }
}
